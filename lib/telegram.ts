import type { OrderWithItems } from "@/lib/db/types";
import { getOrderTotals } from "@/lib/orders/totals";
import { orderStatusLabel } from "@/lib/orders/status";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatAddress(order: OrderWithItems) {
  return [order.city, order.street, order.house, order.building, order.postal]
    .filter(Boolean)
    .join(", ");
}

export async function notifyAdminAboutOrder(order: OrderWithItems) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "";
  const adminUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin/orders/${order.id}` : "";
  const address = formatAddress(order);
  const totals = getOrderTotals(order);
  const items = order.items
    .map((item) => {
      const title = escapeHtml(item.product.title);
      return `• ${title} x ${item.quantity} — ${item.lineTotalDiscounted} RUB`;
    })
    .join("\n");

  const message = [
    "<b>Новый заказ</b>",
    `№ <code>${escapeHtml(order.id)}</code>`,
    `Дата: ${escapeHtml(new Date(order.createdAt).toLocaleString("ru-RU"))}`,
    `Имя: ${escapeHtml(order.customerName || "Не указано")}`,
    `Телефон: ${escapeHtml(order.customerPhone)}`,
    `Email: ${escapeHtml(order.customerEmail || "Не указан")}`,
    "",
    "<b>Товары</b>",
    items,
    "",
    `Статус: ${orderStatusLabel(order.status)}`,
    `Сумма без скидки: ${totals.subtotal} RUB`,
    totals.discount > 0 ? `Скидка: −${totals.discount} RUB (${totals.discountPct}%)` : "",
    `Сумма к оплате: ${totals.total} RUB`,
    `Валюта клиента: ${escapeHtml(order.currency)} (${order.displayTotal})`,
    address ? `Адрес: ${escapeHtml(address)}` : "",
    order.comment ? `Комментарий: ${escapeHtml(order.comment)}` : "",
    adminUrl ? `Админка: ${escapeHtml(adminUrl)}` : ""
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Telegram notification failed", res.status, text);
    }
  } catch (error) {
    console.error("Telegram notification failed", error);
  }
}
