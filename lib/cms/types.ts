export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  inStock: boolean;
  stock?: number;
  description: string;
  details: string[];
  images: string[];
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  customerEmail: string;
  customerPhone: string;
  status: "created" | "paid" | "failed";
};
