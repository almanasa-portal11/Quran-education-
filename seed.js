import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
await prisma.user.upsert({
  where: { email: "admin@center.local" }, update: {},
  create: { name: "Admin", email: "admin@center.local", role: "ADMIN", password: await bcrypt.hash("ChangeMe123!", 10) },
});
console.log("Seeded admin: admin@center.local / ChangeMe123! (change immediately)");
await prisma.$disconnect();
