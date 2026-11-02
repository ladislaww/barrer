import { CartProvider } from "@/components/CartContext";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageContext";
import { DiscountProvider } from "@/components/DiscountContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DiscountProvider>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </DiscountProvider>
    </LanguageProvider>
  );
}
