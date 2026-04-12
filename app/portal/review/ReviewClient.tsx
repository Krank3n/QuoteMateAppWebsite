'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtractedItem, ExtractionResult } from '../../../lib/supplierService';
import styles from './review.module.css';

type FilterMode = 'all' | 'low' | 'missing';

export function ReviewClient() {
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('extractionData');
    if (!stored) {
      router.replace('/portal');
      return;
    }
    let parsed: ExtractionResult;
    try {
      parsed = JSON.parse(stored) as ExtractionResult;
    } catch {
      sessionStorage.removeItem('extractionData');
      router.replace('/portal');
      return;
    }
    setData(parsed);
    setItems(parsed.items);
    setSupplierName(parsed.supplierName);
  }, [router]);

  const lowCount = useMemo(() => items.filter((i) => i.confidence === 'low').length, [items]);
  const missingCount = useMemo(() => items.filter((i) => i.price == null).length, [items]);

  const filteredItems = useMemo(() => {
    let result = items.map((item, originalIndex) => ({ item, originalIndex }));

    if (filter === 'low') {
      result = result.filter(({ item }) => item.confidence === 'low');
    } else if (filter === 'missing') {
      result = result.filter(({ item }) => item.price == null);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(({ item }) => item.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, filter, search]);

  if (!data) return null;

  const updateItem = (index: number, field: keyof ExtractedItem, value: unknown) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (expanded === index) setExpanded(null);
  };

  const removeLowConfidence = () => {
    if (!confirm(`Remove all ${lowCount} low-confidence items?`)) return;
    setItems(items.filter((i) => i.confidence !== 'low'));
    setExpanded(null);
  };

  const handleContinue = () => {
    const updated = { ...data, supplierName, items };
    sessionStorage.setItem('extractionData', JSON.stringify(updated));
    router.push('/portal/signup');
  };

  return (
    <div className={styles.page}>
      {/* Sticky Header */}
      <div className={styles.stickyHeader}>
        <div className={styles.headerInner}>
          <button onClick={() => router.push('/portal')} className={styles.backBtn}>
            &larr; Back
          </button>
          <h1 className={styles.title}>Review Extracted Items</h1>
          <p className={styles.subtitle}>
            {items.length} item{items.length !== 1 ? 's' : ''} from your price list
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className={styles.input}
            />
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className={styles.searchInput}
          />

          <div className={styles.filterRow}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.filterChip} ${filter === 'all' ? styles.filterChipActive : ''}`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`${styles.filterChip} ${filter === 'low' ? styles.filterChipActive : ''}`}
              disabled={lowCount === 0}
            >
              Low confidence ({lowCount})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`${styles.filterChip} ${filter === 'missing' ? styles.filterChipActive : ''}`}
              disabled={missingCount === 0}
            >
              Missing price ({missingCount})
            </button>
            {filter === 'low' && lowCount > 0 && (
              <button onClick={removeLowConfidence} className={styles.removeAllBtn}>
                Remove all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className={styles.itemList}>
        {filteredItems.length === 0 ? (
          <div className={styles.empty}>
            {items.length === 0 ? 'No items to review. Go back and try again.' : 'No items match your filter.'}
          </div>
        ) : (
          filteredItems.map(({ item, originalIndex }) => (
            <ItemRow
              key={originalIndex}
              item={item}
              index={originalIndex}
              expanded={expanded === originalIndex}
              onToggle={() => setExpanded(expanded === originalIndex ? null : originalIndex)}
              onUpdate={(field, value) => updateItem(originalIndex, field, value)}
              onRemove={() => removeItem(originalIndex)}
            />
          ))
        )}
      </div>

      {/* Sticky footer */}
      <div className={styles.stickyFooter}>
        <button
          onClick={handleContinue}
          disabled={items.length === 0 || !supplierName.trim()}
          className={styles.saveBtn}
        >
          Save &amp; Create Account ({items.length} items)
        </button>
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: ExtractedItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof ExtractedItem, value: unknown) => void;
  onRemove: () => void;
}

function ItemRow({ item, expanded, onToggle, onUpdate, onRemove }: ItemRowProps) {
  const confidenceClass =
    item.confidence === 'high'
      ? styles.dotHigh
      : item.confidence === 'medium'
      ? styles.dotMedium
      : styles.dotLow;

  return (
    <div className={`${styles.row} ${expanded ? styles.rowExpanded : ''}`}>
      <div className={styles.rowCompact} onClick={onToggle}>
        <span className={`${styles.confidenceDot} ${confidenceClass}`} title={`${item.confidence} confidence`} />
        <span className={styles.rowName}>{item.name}</span>
        <span className={styles.rowPrice}>
          {item.price != null ? `$${item.price.toFixed(2)}` : <span className={styles.missingPrice}>—</span>}
        </span>
        <span className={styles.rowUnit}>{item.unit}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={styles.removeIcon}
          title="Remove"
          aria-label="Remove item"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className={styles.rowExpand}>
          <div className={styles.expandField}>
            <label className={styles.expandLabel}>Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              className={styles.expandInput}
            />
          </div>
          <div className={styles.expandRow}>
            <div className={styles.expandField}>
              <label className={styles.expandLabel}>Price ($)</label>
              <input
                type="number"
                value={item.price ?? ''}
                onChange={(e) =>
                  onUpdate('price', e.target.value ? parseFloat(e.target.value) : null)
                }
                className={styles.expandInput}
              />
            </div>
            <div className={styles.expandField}>
              <label className={styles.expandLabel}>Unit</label>
              <select
                value={item.unit}
                onChange={(e) => onUpdate('unit', e.target.value)}
                className={styles.expandInput}
              >
                {['each', 'm', 'm²', 'm³', 'L', 'kg', 'box', 'pack'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          {item.rawLine && <div className={styles.rawLine}>Extracted from: {item.rawLine}</div>}
        </div>
      )}
    </div>
  );
}
