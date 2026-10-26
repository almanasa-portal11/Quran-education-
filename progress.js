import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, authorize, wrap } from "../middleware/auth.js";

const r = Router();
r.use(authenticate);

// Teacher records memorization / review / recitation
r.post("/", authorize("ADMIN", "TEACHER"), wrap(async (req, res) => {
  const d = z.object({
    studentId: z.string(), type: z.enum(["HIFZ", "MURAJAA", "TASMEE"]),
    surah: z.number().int().min(1).max(114), fromAyah: z.number().int().min(1), toAyah: z.number().int().min(1),
    rating: z.number().int().min(1).max(5), note: z.string().optional(),
  }).refine((v) => v.toAyah >= v.fromAyah, { message: "toAyah must be >= fromAyah" }).parse(req.body);
  res.status(201).json(await prisma.progress.create({ data: { ...d, teacherId: req.user.id } }));
}));

// Student sees own record; parent sees own children; staff see any
r.get("/student/:studentId", wrap(async (req, res) => {
  const s = await prisma.student.findUnique({ where: { id: req.params.studentId } });
  if (!s) return res.status(404).json({ error: "Not found" });
  const { role, id } = req.user;
  const allowed = role === "ADMIN" || role === "TEACHER" || (role === "STUDENT" && s.userId === id) || (role === "PARENT" && s.parentId === id);
  if (!allowed) return res.status(403).json({ error: "Forbidden" });
  res.json(await prisma.progress.findMany({ where: { studentId: s.id }, orderBy: { date: "desc" } }));
}));

export default r;
