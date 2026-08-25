import Link from 'next/link';
import type { PriceTable as PriceTableData } from '@/lib/data';

// Data-driven price table. AI Overviews and featured snippets favour tabular
// pricing, so figures render as a real <table>, not prose.
export default function PriceTable({ table }: { table: PriceTableData }) {
  return (
    <div className="price-table-block">
      <h2>{table.title}</h2>
      <div className="price-table-wrap">
        <table className="price-table">
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(table.note || table.sourceHref) && (
        <p className="price-table-note">
          {table.note}
          {table.note && table.sourceHref && ' '}
          {table.sourceHref && (
            <Link href={table.sourceHref}>{table.sourceLabel ?? 'See the full guide'}</Link>
          )}
        </p>
      )}
    </div>
  );
}
