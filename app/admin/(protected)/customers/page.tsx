import Link from "next/link";
import { getFilteredCustomers, parseCustomerQuery } from "@/lib/db/customers";
import {
  CUSTOMER_STATUS_LABELS,
  DEFAULT_PER_PAGE,
  INACTIVE_AFTER_DAYS,
  type CustomerSortKey,
  type CustomerStatus
} from "@/lib/customers/constants";
import { formatDate, formatNumber, formatRub } from "@/lib/analytics/format";
import { CustomersFilters, type FiltersState } from "./CustomersFilters";

export const metadata = { title: "Покупатели — Admin" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined) params.set(key, single);
  }
  return params;
}

export default async function CustomersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = toSearchParams(sp);
  const query = parseCustomerQuery(params);
  const rows = await getFilteredCustomers(query);

  const totalPages = Math.max(1, Math.ceil(rows.length / query.perPage));
  const page = Math.min(query.page, totalPages);
  const pageRows = rows.slice((page - 1) * query.perPage, page * query.perPage);

  const initialFilters: FiltersState = {
    q: query.search,
    status: query.status,
    firstFrom: params.get("firstFrom") ?? "",
    firstTo: params.get("firstTo") ?? "",
    lastFrom: params.get("lastFrom") ?? "",
    lastTo: params.get("lastTo") ?? "",
    ordersMin: params.get("ordersMin") ?? "",
    ordersMax: params.get("ordersMax") ?? "",
    spentMin: params.get("spentMin") ?? "",
    spentMax: params.get("spentMax") ?? "",
    perPage: String(query.perPage || DEFAULT_PER_PAGE)
  };

  /** Ссылка с изменёнными параметрами, остальные фильтры сохраняются. */
  function hrefWith(patch: Record<string, string | null>): string {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  function sortHref(key: CustomerSortKey): string {
    // Повторный клик по активной колонке переключает направление
    const dir = query.sort === key && query.dir === "desc" ? "asc" : "desc";
    return hrefWith({ sort: key, dir, page: null });
  }

  const totalRevenue = rows.reduce((sum, row) => sum + row.totalSpent, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, marginBottom: 8 }}>CUSTOMERS</div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Покупатели ({rows.length})</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
          Пользователи с хотя бы одним оплаченным заказом. Неактивный — нет покупок более {INACTIVE_AFTER_DAYS} дней.
          Суммарно: {formatRub(totalRevenue)}.
        </p>
      </div>

      <CustomersFilters initial={initialFilters} sort={query.sort} dir={query.dir} resultCount={rows.length} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 1040 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <SortableTh label="Имя" sortKey="name" active={query.sort} dir={query.dir} href={sortHref("name")} />
              <SortableTh label="Email" sortKey="email" active={query.sort} dir={query.dir} href={sortHref("email")} />
              <Th>Телефон</Th>
              <SortableTh label="Регистрация" sortKey="registeredAt" active={query.sort} dir={query.dir} href={sortHref("registeredAt")} />
              <SortableTh label="Последний заказ" sortKey="lastOrderAt" active={query.sort} dir={query.dir} href={sortHref("lastOrderAt")} />
              <SortableTh label="Заказов" sortKey="ordersCount" active={query.sort} dir={query.dir} href={sortHref("ordersCount")} align="right" />
              <SortableTh label="Сумма покупок" sortKey="totalSpent" active={query.sort} dir={query.dir} href={sortHref("totalSpent")} align="right" />
              <SortableTh label="Средний чек" sortKey="averageCheck" active={query.sort} dir={query.dir} href={sortHref("averageCheck")} align="right" />
              <SortableTh label="Статус" sortKey="status" active={query.sort} dir={query.dir} href={sortHref("status")} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <Td>{row.name ?? "—"}</Td>
                <Td muted>{row.email}</Td>
                <Td muted>{row.phone || "—"}</Td>
                <Td muted>{formatDate(row.registeredAt)}</Td>
                <Td muted>{formatDate(row.lastOrderAt)}</Td>
                <Td align="right" mono>{formatNumber(row.ordersCount)}</Td>
                <Td align="right" mono>{formatRub(row.totalSpent)}</Td>
                <Td align="right" mono>{formatRub(row.averageCheck)}</Td>
                <Td><CustomerStatusBadge status={row.status} /></Td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "40px 0", color: "var(--muted)", textAlign: "center" }}>
                  Покупатели не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: 12 }}>
            Страница {page} из {totalPages} · показано {pageRows.length} из {rows.length}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <PageLink href={hrefWith({ page: String(page - 1) })} disabled={page <= 1}>←</PageLink>
            {pageNumbers(page, totalPages).map((item, index) =>
              item === null ? (
                <span key={`gap-${index}`} style={{ color: "var(--muted)", padding: "6px 4px", fontSize: 12 }}>…</span>
              ) : (
                <PageLink key={item} href={hrefWith({ page: String(item) })} active={item === page}>
                  {item}
                </PageLink>
              )
            )}
            <PageLink href={hrefWith({ page: String(page + 1) })} disabled={page >= totalPages}>→</PageLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Компактный набор номеров страниц с многоточиями. */
function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) result.push(null);
    result.push(p);
    previous = p;
  }
  return result;
}

function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const colors: Record<CustomerStatus, string> = {
    NEW: "#8ab4f8",
    RETURNING: "#4caf50",
    INACTIVE: "#8a8a8a"
  };
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        padding: "3px 8px",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: colors[status],
        whiteSpace: "nowrap"
      }}
    >
      {CUSTOMER_STATUS_LABELS[status]}
    </span>
  );
}

function SortableTh({
  label,
  sortKey,
  active,
  dir,
  href,
  align = "left"
}: {
  label: string;
  sortKey: CustomerSortKey;
  active: string;
  dir: string;
  href: string;
  align?: "left" | "right";
}) {
  const isActive = active === sortKey;
  return (
    <th style={{ textAlign: align, padding: "8px 12px 8px 0", fontWeight: 400, fontSize: 12 }}>
      <Link
        href={href}
        style={{
          color: isActive ? "var(--text)" : "var(--muted)",
          textDecoration: "none",
          display: "inline-flex",
          gap: 4,
          alignItems: "center",
          whiteSpace: "nowrap"
        }}
      >
        {label}
        <span style={{ fontSize: 9, opacity: isActive ? 1 : 0.35 }}>{isActive && dir === "asc" ? "▲" : "▼"}</span>
      </Link>
    </th>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "8px 12px 8px 0", fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  muted,
  mono
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 12px 12px 0",
        textAlign: align,
        color: muted ? "var(--muted)" : undefined,
        fontFamily: mono ? "monospace" : undefined,
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </td>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const style: React.CSSProperties = {
    display: "inline-block",
    minWidth: 30,
    textAlign: "center",
    padding: "6px 8px",
    fontSize: 12,
    fontFamily: "monospace",
    border: "1px solid var(--border)",
    borderRadius: 4,
    textDecoration: "none",
    background: active ? "var(--text)" : "transparent",
    color: active ? "var(--bg)" : "var(--muted)"
  };
  if (disabled) {
    return <span style={{ ...style, opacity: 0.35 }}>{children}</span>;
  }
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}
