export type { OrderStatus } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/status";

export type Currency = "RUB" | "USD";
export type UserRole = "ADMIN" | "CUSTOMER";
export type CardStatus = "ACTIVE" | "INACTIVE";

export type MembersCard = {
  id: string;
  userId: string;
  /** Ровно 8 цифр, уникален. Строка, а не число, из-за ведущих нулей. */
  number: string;
  status: CardStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Discount = {
  id: string;
  percentage: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  products: { productId: string }[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  price: number;
  stock: number;
  inStock: boolean;
  isVisible: boolean;
  description: string;
  descriptionEn: string | null;
  details: string[];
  detailsEn: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  /** Цена за единицу без скидки на момент заказа */
  unitPrice: number;
  /** Цена за единицу со скидкой на момент заказа */
  unitPriceDiscounted: number;
  /** Стоимость позиции без скидки */
  lineTotal: number;
  /** Стоимость позиции со скидкой */
  lineTotalDiscounted: number;
};

export type Order = {
  id: string;
  userId: string | null;
  customerEmail: string;
  customerPhone: string;
  customerName: string | null;
  city: string | null;
  street: string | null;
  house: string | null;
  building: string | null;
  postal: string | null;
  comment: string | null;
  total: number;
  /** Общая сумма заказа со скидкой, в рублях */
  totalRub: number;
  /** Общая сумма заказа без скидки, в рублях */
  subtotalRub: number;
  /** Сумма предоставленной скидки, в рублях */
  discountRub: number;
  currency: Currency;
  exchangeRate: number;
  displayTotal: number;
  status: OrderStatus;
  discountPct: number;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  street: string | null;
  house: string | null;
  building: string | null;
  postal: string | null;
  role: UserRole;
  offerAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
