import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, authorize, wrap } from "../middleware/auth.js";

const r = Router();
r.use(authenticate);

r.get("/", wrap(async (req, res) => {
  const where = req.user.role === "TEACHER" ? { teacherId: req.user.id } : {};
  res.json(await prisma.halaqa.findMany({ where, include: { teacher: { select: { name: true } }, _count: { select: { students: true } } } }));
}));

r.post("/", authorize("ADMIN"), wrap(async (req, res) => {
  const d = z.object({ name: z.string(), teacherId: z.string(), zoomLink: z.string().url().optional(), schedule: z.string().optional() }).parse(req.body);
  res.status(201).json(await prisma.halaqa.create({ data: d }));
}));

// Teacher: open a session and record attendance in one request
r.post("/:id/sessions", authorize("ADMIN", "TEACHER"), wrap(async (req, res) => {
  const d = z.object({
    date: z.coerce.date(),
    attendance: z.array(z.object({ studentId: z.string(), status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]) })),
  }).parse(req.body);
  const session = await prisma.session.create({
    data: { halaqaId: req.params.id, date: d.date, attendance: { create: d.attendance } },
    include: { attendance: true },
  });
  res.status(201).json(session);
}));

export default r;
