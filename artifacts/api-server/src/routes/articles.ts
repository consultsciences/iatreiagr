import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { generateArticles } from "../lib/articleGenerator";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/articles — public list of published articles
router.get("/articles", async (req, res) => {
  const { limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 20, 100);
  const off = parseInt(offset) || 0;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.created_at))
    .limit(lim)
    .offset(off);

  res.json({ articles: rows });
});

// GET /api/articles/:slug — public single article
router.get("/articles/:slug", async (req, res) => {
  const slug = req.params.slug as string;
  const [row] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, slug))
    .limit(1);

  if (!row || !row.published) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(row);
});

// POST /api/admin/articles/generate — admin: trigger AI generation
router.post("/admin/articles/generate", requireAdmin, async (req, res) => {
  const { count = 4 } = req.body as { count?: number };
  const n = Math.min(Math.max(Number(count) || 4, 1), 10);

  try {
    const generated = await generateArticles(n);
    res.json({ generated: generated.length, articles: generated });
  } catch (err) {
    logger.error({ err }, "articles: generation failed");
    res.status(500).json({ error: "Generation failed" });
  }
});

// DELETE /api/admin/articles/:id — admin: delete an article
router.delete("/admin/articles/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.status(204).end();
});

export default router;
