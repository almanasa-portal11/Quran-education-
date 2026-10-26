import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, authorize, wrap } from "../middleware/auth.js";

const r = Router();

// Public: registration form on the website
r.post("/", wrap(async (req, res) => {
  const d = z.object({
    studentName: z.string().min(2), parentName: z.string().min(2),
    email: z.string().email(), phone: z.string().min(6), notes: z.string().optional(),
  }).parse(req.body);
  res.status(201).json(await prisma.admissionRequest.create({ data: d }));
}));

r.get("/", authenticate, authorize("ADMIN"), wrap(async (_req, res) =>
  res.json(await prisma.admissionRequest.findMany({ orderBy: { createdAt: "desc" } }))));

r.patch("/:id", authenticate, authorize("ADMIN"), wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
  res.json(await prisma.admissionRequest.update({ where: { id: req.params.id }, data: { status } }));
}));

export default r;
