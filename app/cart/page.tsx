import { CartView } from "@/components/CartView";

export default function CartPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="mono" style={{ marginBottom: 16 }}>
          Cart
        </div>
        <CartView />
      </div>
    </div>
  );
}
