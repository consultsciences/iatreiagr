import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable } from "@workspace/db";
import { CreateInquiryBody } from "@workspace/api-zod";

const router = Router();

router.post("/inquiries", async (req, res) => {
  const parsed = CreateInquiryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  await db.insert(inquiriesTable).values(parsed.data);
  res.status(201).end();
});

export default router;
