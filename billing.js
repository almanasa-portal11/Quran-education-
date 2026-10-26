import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, authorize, wrap } from "../middleware/auth.js";

const r = Router();
r.use(authenticate);

// Admin generates the monthly invoice for every active student
r.post("/generate", authorize("ADMIN"), wrap(async (req, res) => {
  const { month, amount } = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), amount: z.number().positive() }).parse(req.body);
  const students = await prisma.student.findMany({ where: { user: { active: true } }, select: { id: true } });
  const result = await prisma.invoice.createMany({
    data: students.map((s) => ({ studentId: s.id, month, amount })), skipDuplicates: true,
  });
  res.status(201).json({ created: result.count });
}));

r.patch("/:id/pay", authorize("ADMIN"), wrap(async (req, res) =>
  res.json(await prisma.invoice.update({ where: { id: req.params.id }, data: { status: "PAID", paidAt: new Date() } }))));

// Parent: invoices of own children
r.get("/mine", authorize("PARENT"), wrap(async (req, res) =>
  res.json(await prisma.invoice.findMany({ where: { student: { parentId: req.user.id } }, orderBy: { month: "desc" }, include: { student: { include: { user: { select: { name: true } } } } } }))));

// Admin dashboard statistics
r.get("/stats", authorize("ADMIN"), wrap(async (_req, res) => {
  const [students, teachers, paid, pending] = await Promise.all([
    prisma.student.count(), prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
  ]);
  res.json({ students, teachers, revenuePaid: paid._sum.amount ?? 0, revenuePending: pending._sum.amount ?? 0 });
}));

export default r;
