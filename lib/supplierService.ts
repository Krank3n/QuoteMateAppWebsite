import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, functions, auth, storage } from './firebase';

export interface ExtractedItem {
  name: string;
  price: number | null;
  unit: string;
  coveragePerUnit?: number;
  coverageUnit?: string;
  keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  rawLine: string;
}

export interface ExtractionResult {
  supplierName: string;
  supplierContact: {
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  } | null;
  items: ExtractedItem[];
}

export interface SupplierProfile {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  ownerUid: string;
  status: 'pending' | 'active' | 'suspended';
  itemCount: number;
  subscriberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';

// --- Extraction ---

function fileToBase64WithType(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        data: result.split(',')[1],
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractPriceList(
  files: File[],
  supplierName?: string
): Promise<ExtractionResult> {
  const isPdf = files.length === 1 && files[0].type === 'application/pdf';

  let body: Record<string, unknown>;
  if (isPdf) {
    const pdf = await fileToBase64WithType(files[0]);
    body = { pdfBase64: pdf.data, supplierName };
  } else {
    const images = await Promise.all(files.map(fileToBase64WithType));
    body = { imageBase64: images, supplierName };
  }

  const res = await fetch(`${FUNCTIONS_BASE}/extractSupplierPriceListPublic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Supplier CRUD ---

/** Firestore rejects raw `undefined` — strip any undefined fields before writing. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export async function createOrUpdateSupplier(
  supplierId: string,
  data: Partial<Omit<SupplierProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const ref = doc(db, 'suppliers', supplierId);
  const existing = await getDoc(ref);
  const cleaned = stripUndefined(data);

  if (existing.exists()) {
    await setDoc(ref, { ...cleaned, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, {
      ...cleaned,
      status: 'pending',
      itemCount: 0,
      subscriberCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getSupplier(supplierId: string): Promise<SupplierProfile | null> {
  const snap = await getDoc(doc(db, 'suppliers', supplierId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SupplierProfile;
}

export async function savePriceItems(
  supplierId: string,
  items: ExtractedItem[]
): Promise<void> {
  for (const item of items) {
    const slug = item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);

    const itemRef = doc(db, `suppliers/${supplierId}/priceItems`, slug);
    await setDoc(itemRef, {
      ...stripUndefined(item as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getPriceItems(supplierId: string): Promise<(ExtractedItem & { id: string })[]> {
  const snap = await getDocs(collection(db, `suppliers/${supplierId}/priceItems`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExtractedItem & { id: string }));
}

export async function deletePriceItem(supplierId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, `suppliers/${supplierId}/priceItems`, itemId));
}

export async function setSupplierClaim(supplierId: string): Promise<void> {
  const callable = httpsCallable(functions, 'setSupplierClaim');
  await callable({ supplierId });
  await auth.currentUser?.getIdToken(true);
}

/**
 * Upload a supplier logo to Firebase Storage and return the download URL.
 * Stores at suppliers/{supplierId}/logo.{ext}
 */
export async function uploadSupplierLogo(supplierId: string, file: File): Promise<string> {
  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo must be less than 2 MB');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `suppliers/${supplierId}/logo.${ext}`;
  const ref = storageRef(storage, path);

  await uploadBytes(ref, file, { contentType: file.type });
  const url = await getDownloadURL(ref);

  // Update supplier doc with new logoUrl
  await createOrUpdateSupplier(supplierId, { logoUrl: url, ownerUid: supplierId });

  return url;
}
