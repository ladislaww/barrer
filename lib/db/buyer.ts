export type BuyerOrderRef = { userId: string | null; customerEmail: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Единое правило определения покупателя для аналитики и базы покупателей:
 * заказ авторизованного пользователя — по userId, гостевой — по совпадению e-mail
 * с зарегистрированным аккаунтом. Иначе покупатель опознаётся по самому e-mail.
 *
 * Без этого один и тот же человек, купивший до и после регистрации, считался бы
 * двумя разными покупателями в аналитике и одним — в базе покупателей.
 */
export function makeBuyerKeyResolver(users: { id: string; email: string }[]) {
  const userIdByEmail = new Map(users.map((u) => [normalizeEmail(u.email), u.id]));
  return (order: BuyerOrderRef): string => {
    if (order.userId) return order.userId;
    const email = normalizeEmail(order.customerEmail);
    return userIdByEmail.get(email) ?? `email:${email}`;
  };
}
