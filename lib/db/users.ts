import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { withUniqueCardNumber } from "./cards";
import type { User } from "./types";

function normalizeUser(user: Awaited<ReturnType<typeof prisma.user.findUnique>>): User | null {
  if (!user) return null;
  return {
    ...user,
    role: user.role === "ADMIN" ? "ADMIN" : "CUSTOMER"
  };
}

export async function getUserById(id: string): Promise<User | null> {
  return normalizeUser(await prisma.user.findUnique({ where: { id } }));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return normalizeUser(await prisma.user.findUnique({ where: { email } }));
}

export async function createCustomer(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  city?: string;
  street?: string;
  house?: string;
  building?: string;
  postal?: string;
}) {
  const password = await bcrypt.hash(input.password, 12);
  // Карта выдаётся сразу при регистрации, номер подбирается тем же механизмом, что и в админке
  return withUniqueCardNumber((number) =>
    prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password,
        name: input.name,
        phone: input.phone,
        city: input.city,
        street: input.street,
        house: input.house,
        building: input.building,
        postal: input.postal,
        role: "CUSTOMER",
        offerAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        card: { create: { status: "ACTIVE", number } }
      }
    })
  );
}

export async function updateCustomerProfile(
  id: string,
  input: {
    name?: string;
    phone?: string;
    city?: string;
    street?: string;
    house?: string;
    building?: string;
    postal?: string;
    password?: string;
  }
) {
  const password = input.password ? await bcrypt.hash(input.password, 12) : undefined;
  return prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone,
      city: input.city,
      street: input.street,
      house: input.house,
      building: input.building,
      postal: input.postal,
      password
    }
  });
}
