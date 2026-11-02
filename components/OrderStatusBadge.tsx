import { ORDER_STATUS_META, type OrderStatus } from "@/lib/orders/status";

export function OrderStatusBadge({
  status,
  size = "md"
}: {
  status: OrderStatus;
  size?: "sm" | "md";
}) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      title={meta.hint}
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        border: `1px solid ${meta.color}`,
        color: meta.color,
        borderRadius: 999,
        fontSize: size === "sm" ? 11 : 12,
        lineHeight: 1.4,
        padding: size === "sm" ? "2px 8px" : "3px 10px"
      }}
    >
      {meta.ru}
    </span>
  );
}
