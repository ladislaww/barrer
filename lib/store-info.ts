/**
 * Реквизиты магазина — единственный источник правды для подвала, страницы
 * контактов и оферты. Раньше они были захардкожены в трёх местах, причём
 * с заглушками вида `support@barrer.example` и `+7 000 000-00-00`, которые
 * видел покупатель.
 *
 * Значения берутся из окружения. Незаполненные поля не выводятся совсем:
 * лучше не показать строку, чем показать заведомо неверный телефон.
 * Перед запуском заполнить в `.env` всё из блока STORE_* — для розничной
 * торговли в РФ наименование продавца, ИНН/ОГРН и адрес обязательны.
 */

export type StoreContact = { label: string; value: string; href?: string };

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export const storeInfo = {
  legalName: clean(process.env.NEXT_PUBLIC_STORE_LEGAL_NAME),
  inn: clean(process.env.NEXT_PUBLIC_STORE_INN),
  ogrn: clean(process.env.NEXT_PUBLIC_STORE_OGRN),
  address: clean(process.env.NEXT_PUBLIC_STORE_ADDRESS),
  email: clean(process.env.NEXT_PUBLIC_STORE_EMAIL),
  phone: clean(process.env.NEXT_PUBLIC_STORE_PHONE),
  instagram: clean(process.env.NEXT_PUBLIC_STORE_INSTAGRAM)
};

/** Телефон для `tel:` — без пробелов, скобок и дефисов. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Способы связи, которые реально заполнены. */
export function contactChannels(): StoreContact[] {
  const channels: StoreContact[] = [];
  if (storeInfo.email) {
    channels.push({ label: "Email", value: storeInfo.email, href: `mailto:${storeInfo.email}` });
  }
  if (storeInfo.phone) {
    channels.push({ label: "Телефон", value: storeInfo.phone, href: telHref(storeInfo.phone) });
  }
  if (storeInfo.instagram) {
    const handle = storeInfo.instagram.replace(/^@/, "");
    channels.push({
      label: "Instagram",
      value: `@${handle}`,
      href: `https://instagram.com/${handle}`
    });
  }
  return channels;
}

/** Юридические реквизиты продавца, которые реально заполнены. */
export function legalDetails(): StoreContact[] {
  const details: StoreContact[] = [];
  if (storeInfo.legalName) details.push({ label: "Продавец", value: storeInfo.legalName });
  if (storeInfo.inn) details.push({ label: "ИНН", value: storeInfo.inn });
  if (storeInfo.ogrn) details.push({ label: "ОГРН", value: storeInfo.ogrn });
  if (storeInfo.address) details.push({ label: "Адрес", value: storeInfo.address });
  return details;
}

export function hasAnyContacts(): boolean {
  return contactChannels().length > 0 || legalDetails().length > 0;
}
