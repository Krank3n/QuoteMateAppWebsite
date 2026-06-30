import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import app from './firebase';

// Firestore + Storage live here, separate from lib/firebase.ts, so that the
// many pages that only need Auth/Functions (the entire admin panel) don't pull
// the Firestore/Storage SDKs into their bundle. Only supplierService (portal)
// imports this module, so those SDKs are code-split into the portal chunks.
export const db = getFirestore(app);
export const storage = getStorage(app);
