import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, authorize, wrap } from "../middleware/auth.js";

const r = Router();

r.post("/login", wrap(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}));

r.get("/me", authenticate, wrap(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true } });
  res.json(u);
}));

// Admin creates accounts (student / parent / teacher)
r.post("/users", authenticate, authorize("ADMIN"), wrap(async (req, res) => {
  const d = z.object({
    name: z.string().min(2), email: z.string().email(), phone: z.string().optional(),
    password: z.string().min(8), role: z.enum(["TEACHER", "PARENT", "STUDENT", "ADMIN"]),
    parentId: z.string().optional(), halaqaId: z.string().optional(),
  }).parse(req.body);
  const user = await prisma.user.create({
    data: {
      name: d.name, email: d.email, phone: d.phone, role: d.role,
      password: await bcrypt.hash(d.password, 10),
      ...(d.role === "STUDENT" && { student: { create: { parentId: d.parentId, halaqaId: d.halaqaId } } }),
    },
    select: { id: true, name: true, role: true },
  });
  res.status(201).json(user);
}));

export default r;
