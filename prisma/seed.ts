import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Учётные данные администратора берутся из окружения. Раньше здесь был
 * захардкоженный пароль, продублированный в README и DEPLOY.md, — то есть
 * пароль боевой админки лежал в репозитории. Если пароль не задан, генерируем
 * случайный и печатаем один раз: записать его — задача того, кто разворачивает.
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@barrer.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    // Пароль существующего админа не трогаем: повторный seed не должен
    // откатывать смену пароля на проде.
    await prisma.user.update({ where: { email: adminEmail }, data: { role: "ADMIN" } });
    console.log("Admin user:", adminEmail, "(пароль не изменён)");
  } else {
    const generatedPassword = process.env.ADMIN_PASSWORD ? null : randomBytes(12).toString("base64url");
    const adminPassword = process.env.ADMIN_PASSWORD ?? generatedPassword!;
    const password = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: { email: adminEmail, password, name: "Admin", role: "ADMIN" }
    });
    console.log("Admin user:", adminEmail);
    if (generatedPassword) {
      console.log(`Сгенерирован пароль администратора: ${generatedPassword}`);
      console.log("Сохраните его — повторно он не отобразится.");
    }
  }

  // Sample products
  const products = [
    {
      slug: "void-sleeve-coat",
      title: "Void Sleeve Coat",
      titleEn: "Void Sleeve Coat",
      price: 94000,
      stock: 5,
      inStock: true,
      isVisible: true,
      description: "Structured wool-blend coat with elongated sleeve geometry. Designed for a low-contrast silhouette.",
      descriptionEn: "Structured wool-blend coat with elongated sleeve geometry. Designed for a low-contrast silhouette.",
      details: ["Italian wool blend", "Hidden placket", "Oversized shoulders", "Unlined"],
      detailsEn: ["Italian wool blend", "Hidden placket", "Oversized shoulders", "Unlined"],
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
      ]
    },
    {
      slug: "monolith-cargo-trouser",
      title: "Monolith Cargo Trouser",
      titleEn: "Monolith Cargo Trouser",
      price: 54000,
      stock: 0,
      inStock: false,
      isVisible: true,
      description: "Wide-leg trouser with utilitarian paneling and deep matte finish. Built for movement.",
      descriptionEn: "Wide-leg trouser with utilitarian paneling and deep matte finish. Built for movement.",
      details: ["Japanese twill", "Adjustable hem", "Side volume pockets"],
      detailsEn: ["Japanese twill", "Adjustable hem", "Side volume pockets"],
      images: [
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"
      ]
    },
    {
      slug: "fog-layer-hoodie",
      title: "Fog Layer Hoodie",
      titleEn: "Fog Layer Hoodie",
      price: 42000,
      stock: 3,
      inStock: true,
      isVisible: true,
      description: "Oversized hoodie in dense cotton-poly blend. Dropped shoulders, elongated hem.",
      descriptionEn: "Oversized hoodie in dense cotton-poly blend. Dropped shoulders, elongated hem.",
      details: ["Cotton-poly fleece", "Dropped shoulder seam", "Kangaroo pocket"],
      detailsEn: ["Cotton-poly fleece", "Dropped shoulder seam", "Kangaroo pocket"],
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=900&q=80"
      ]
    }
  ];

  for (const data of products) {
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        titleEn: data.titleEn,
        isVisible: data.isVisible,
        descriptionEn: data.descriptionEn,
        detailsEn: JSON.stringify(data.detailsEn)
      },
      create: {
        ...data,
        details: JSON.stringify(data.details),
        detailsEn: JSON.stringify(data.detailsEn),
        images: JSON.stringify(data.images)
      }
    });
    console.log("Product:", product.title);
  }

  console.log("\nSeed complete.");
  console.log(`Login: ${adminEmail}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
