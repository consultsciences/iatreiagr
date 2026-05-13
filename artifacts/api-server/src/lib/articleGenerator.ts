import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { logger } from "./logger";

const CATEGORIES = [
  "Νέα Ιατρικής",
  "Ψυχική Υγεία",
  "Οδοντιατρική",
  "Καρδιολογία",
  "Δερματολογία",
  "Ορθοπεδική",
  "Οφθαλμολογία",
  "Παθολογία",
  "Νευρολογία",
  "Αγορά Υγείας",
];

const COVER_IMAGES: Record<string, string> = {
  "Νέα Ιατρικής": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
  "Ψυχική Υγεία": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=500&fit=crop",
  "Οδοντιατρική": "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=500&fit=crop",
  "Καρδιολογία": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=500&fit=crop",
  "Δερματολογία": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=500&fit=crop",
  "Ορθοπεδική": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
  "Οφθαλμολογία": "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&h=500&fit=crop",
  "Παθολογία": "https://images.unsplash.com/photo-1584982751601-97dea52e4e9e?w=800&h=500&fit=crop",
  "Νευρολογία": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=500&fit=crop",
  "Αγορά Υγείας": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[αάΑΆ]/g, "a")
    .replace(/[εέΕΈ]/g, "e")
    .replace(/[ηήΗΉ]/g, "i")
    .replace(/[ιίϊΙΊΪ]/g, "i")
    .replace(/[οόΟΌ]/g, "o")
    .replace(/[υύϋΥΎΫ]/g, "y")
    .replace(/[ωώΩΏ]/g, "o")
    .replace(/[θΘ]/g, "th")
    .replace(/[χΧ]/g, "ch")
    .replace(/[ψΨ]/g, "ps")
    .replace(/[ξΞ]/g, "x")
    .replace(/[φΦ]/g, "f")
    .replace(/[γΓ]/g, "g")
    .replace(/[δΔ]/g, "d")
    .replace(/[λΛ]/g, "l")
    .replace(/[μΜ]/g, "m")
    .replace(/[νΝ]/g, "n")
    .replace(/[πΠ]/g, "p")
    .replace(/[ρΡ]/g, "r")
    .replace(/[σΣς]/g, "s")
    .replace(/[τΤ]/g, "t")
    .replace(/[βΒ]/g, "v")
    .replace(/[κΚ]/g, "k")
    .replace(/[ζΖ]/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 200));
  return `${minutes} λεπτά`;
}

function pickCategories(n: number): string[] {
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

interface GeneratedArticleData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
}

async function generateSingleArticle(category: string): Promise<GeneratedArticleData> {
  const today = new Date().toLocaleDateString("el-GR", { year: "numeric", month: "long", day: "numeric" });

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `Είσαι συντάκτης ιατρικού ενημερωτικού ιστότοπου για Έλληνες επαγγελματίες υγείας και επαγγελματίες της ιατρικής αγοράς. Γράφεις άρθρα στα ελληνικά, επαγγελματικά, χρήσιμα και ενημερωτικά. Σήμερα είναι ${today}.`,
      },
      {
        role: "user",
        content: `Γράψε ένα σύντομο ιατρικό άρθρο στα ελληνικά για την κατηγορία: "${category}".

Το άρθρο πρέπει να είναι επίκαιρο, να αφορά την ελληνική αγορά υγείας ή διεθνείς εξελίξεις σχετικές με Έλληνες επαγγελματίες.

Απάντησε ΜΟΝΟ με έγκυρο JSON στην παρακάτω μορφή (χωρίς markdown backticks):
{
  "title": "Τίτλος άρθρου (max 80 χαρακτήρες)",
  "excerpt": "Σύντομη περίληψη 1-2 προτάσεων",
  "content": "Πλήρες κείμενο άρθρου 300-500 λέξεις, με παραγράφους χωρισμένες με \\n\\n",
  "author": "Ονοματεπώνυμο και τίτλος (π.χ. Δρ. Μαρία Παπαδοπούλου, Παθολόγος)"
}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
  const parsed = JSON.parse(cleaned) as GeneratedArticleData;

  return { ...parsed, category };
}

export async function generateArticles(count: number) {
  const categories = pickCategories(count);

  const results = await batchProcess(
    categories,
    async (category) => {
      try {
        return await generateSingleArticle(category);
      } catch (err) {
        logger.error({ err, category }, "articleGenerator: failed to generate article");
        return null;
      }
    },
    { concurrency: 2, retries: 3 }
  );

  const validResults = results.filter((r): r is GeneratedArticleData => r !== null);

  const inserted = await Promise.all(
    validResults.map(async (data) => {
      const baseSlug = slugify(data.title) || `article-${Date.now()}`;
      const slug = `${baseSlug}-${Date.now().toString(36)}`;
      const imageUrl = COVER_IMAGES[data.category] ?? COVER_IMAGES["Νέα Ιατρικής"];
      const readTime = estimateReadTime(data.content);

      try {
        const [row] = await db
          .insert(articlesTable)
          .values({
            slug,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            image_url: imageUrl,
            read_time: readTime,
            author: data.author,
            published: true,
          })
          .returning();
        return row;
      } catch (err) {
        logger.error({ err, slug }, "articleGenerator: DB insert failed");
        return null;
      }
    })
  );

  return inserted.filter(Boolean);
}
