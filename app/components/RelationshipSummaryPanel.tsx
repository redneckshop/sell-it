import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type RelationshipSummaryItem = {
  key?: string;
  label: string;
  count: number;
  href?: string;
  description?: string;
};

type RelationshipSummaryPanelProps = {
  title: string;
  subtitle?: string;
  items: RelationshipSummaryItem[];
  footer?: ReactNode;
  maxWidth?: string;
};

const panelStyle: CSSProperties = {
  border: "1px solid #333",
  backgroundColor: "#1a1a1a",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "28px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  backgroundColor: "#111",
  borderRadius: "8px",
  padding: "14px",
  color: "white",
  textDecoration: "none",
  display: "block",
};

const countStyle: CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "4px",
};

const labelStyle: CSSProperties = {
  color: "#ddd",
  fontWeight: "bold",
};

const descriptionStyle: CSSProperties = {
  color: "#aaa",
  fontSize: "13px",
  marginTop: "6px",
};

function cleanCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value;
}

export default function RelationshipSummaryPanel({
  title,
  subtitle,
  items,
  footer,
  maxWidth = "1000px",
}: RelationshipSummaryPanelProps) {
  return (
    <section style={{ ...panelStyle, maxWidth }}>
      <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{title}</h2>

      {subtitle && (
        <p style={{ color: "#aaa", marginTop: 0, marginBottom: 0 }}>
          {subtitle}
        </p>
      )}

      <div style={gridStyle}>
        {items.map((item, index) => {
          const content = (
            <>
              <div style={countStyle}>{cleanCount(item.count)}</div>
              <div style={labelStyle}>{item.label}</div>
              {item.description && (
                <div style={descriptionStyle}>{item.description}</div>
              )}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.key ?? `${item.label}-${index}`}
                href={item.href}
                style={cardStyle}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={item.key ?? `${item.label}-${index}`} style={cardStyle}>
              {content}
            </div>
          );
        })}
      </div>

      {footer && <div style={{ marginTop: "16px" }}>{footer}</div>}
    </section>
  );
}
