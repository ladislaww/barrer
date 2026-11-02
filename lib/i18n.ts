import type { Currency, Product } from "@/lib/db/types";

export type Locale = "ru" | "en";

/**
 * Английская версия переведена частично: подписи полей и оба согласия в
 * чекауте остаются на русском, а цена считается по выдуманному курсу ниже,
 * поэтому пальто за 940 ₽ показывалось как «$9». До полного перевода и
 * настоящего источника котировок переключатель языка скрыт.
 *
 * Вернуть: NEXT_PUBLIC_ENABLE_EN="true" в `.env`.
 */
export const EN_LOCALE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_EN === "true";

export const USD_RATE_RUB = 100;

export const messages = {
  ru: {
    catalog: "Каталог",
    about: "О бренде",
    cart: "Корзина",
    account: "Кабинет",
    login: "Вход",
    logout: "Выйти",
    inStock: "В наличии",
    soldOut: "Нет в наличии",
    addToCart: "Добавить в корзину",
    added: "Добавлено",
    cartEmpty: "Корзина пуста",
    cartEmptyText: "Выберите товар из каталога.",
    backToCatalog: "Назад в каталог",
    quantity: "Кол-во",
    remove: "Удалить",
    total: "Итого",
    checkout: "Оформление заказа",
    proceedCheckout: "Перейти к оформлению",
    checkoutSubmit: "Подтвердить заказ",
    processing: "Обработка...",
    orderCreated: "Заказ создан",
    orderCreatedText: "Мы свяжемся с вами для подтверждения заказа.",
    unavailableProduct: "Один из товаров больше недоступен. Удалите его из корзины.",
    insufficientStock: "Недостаточно товара на складе. Уменьшите количество или удалите позицию.",
    fallbackImage: "Нет изображения"
  },
  en: {
    catalog: "Catalog",
    about: "About",
    cart: "Cart",
    account: "Account",
    login: "Sign in",
    logout: "Sign out",
    inStock: "In stock",
    soldOut: "Sold out",
    addToCart: "Add to cart",
    added: "Added",
    cartEmpty: "Cart empty",
    cartEmptyText: "Choose something from the catalog.",
    backToCatalog: "Back to catalog",
    quantity: "Qty",
    remove: "Remove",
    total: "Total",
    checkout: "Checkout",
    proceedCheckout: "Proceed to checkout",
    checkoutSubmit: "Place order",
    processing: "Processing...",
    orderCreated: "Order created",
    orderCreatedText: "We will contact you to confirm the order.",
    unavailableProduct: "One of the products is no longer available. Remove it from cart.",
    insufficientStock: "Insufficient stock. Reduce quantity or remove the item.",
    fallbackImage: "No image"
  }
} as const;

export function productTitle(product: Product, locale: Locale) {
  return locale === "en" && product.titleEn ? product.titleEn : product.title;
}

export function productDescription(product: Product, locale: Locale) {
  return locale === "en" && product.descriptionEn ? product.descriptionEn : product.description;
}

export function productDetails(product: Product, locale: Locale) {
  return locale === "en" && product.detailsEn.length > 0 ? product.detailsEn : product.details;
}

export function localeCurrency(locale: Locale): Currency {
  return locale === "en" ? "USD" : "RUB";
}

export function displayAmountRub(priceRub: number, locale: Locale) {
  if (locale === "en") {
    return priceRub / USD_RATE_RUB;
  }
  return priceRub;
}

export function formatMoneyRub(priceRub: number, locale: Locale) {
  if (locale === "en") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(priceRub / USD_RATE_RUB);
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(priceRub);
}
