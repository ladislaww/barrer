import { contactChannels, legalDetails } from "@/lib/store-info";

/**
 * ВНИМАНИЕ: это черновик структуры оферты, а не готовый юридический документ.
 *
 * Разделы «Оплата и доставка» и «Возврат» должен заполнить юрист — и только
 * после того, как будет выбран платёжный провайдер и способы доставки.
 * Реквизиты продавца подтягиваются из блока STORE_* в `.env`.
 *
 * Текст с инструкциями владельцу раньше выводился прямо на страницу и его
 * видел покупатель — поэтому он переехал сюда, в комментарий.
 */

export const metadata = { title: "Публичная оферта — Barrer" };

export default function OfferPage() {
  const details = legalDetails();
  const channels = contactChannels();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 840 }}>
        <div className="mono">Legal</div>
        <h1 style={{ fontSize: 36 }}>Публичная оферта</h1>
        <div className="card">
          <h2>1. Продавец</h2>
          {details.length > 0 || channels.length > 0 ? (
            <dl style={{ display: "grid", gap: 8, margin: 0 }}>
              {[...details, ...channels].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <dt className="muted" style={{ minWidth: 110 }}>{item.label}</dt>
                  <dd style={{ margin: 0 }}>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">Реквизиты продавца уточняются.</p>
          )}

          <h2>2. Товар</h2>
          <p>Описание, цена, наличие и характеристики товара размещаются в карточке товара.</p>

          <h2>3. Оформление заказа</h2>
          <p>
            Заказ считается оформленным после заполнения формы и подтверждения покупателем условий
            оферты.
          </p>

          <h2>4. Оплата и доставка</h2>
          <p className="muted">Условия оплаты и доставки уточняются.</p>

          <h2>5. Возврат</h2>
          <p>
            Возврат товара надлежащего и ненадлежащего качества осуществляется в соответствии с
            законодательством Российской Федерации.
          </p>

          <h2>6. Персональные данные</h2>
          <p>Обработка персональных данных выполняется согласно политике обработки персональных данных.</p>
        </div>
      </div>
    </div>
  );
}
