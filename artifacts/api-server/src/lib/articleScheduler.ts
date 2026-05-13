import cron from "node-cron";
import { generateArticles } from "./articleGenerator";
import { logger } from "./logger";

const ARTICLES_PER_RUN = 4;

export function startArticleScheduler() {
  // Run at 03:00 on day 1, 4, 7, 10 … of every month (every ~3 days)
  const schedule = "0 3 */3 * *";

  cron.schedule(schedule, async () => {
    logger.info("articleScheduler: starting scheduled article generation");
    try {
      const articles = await generateArticles(ARTICLES_PER_RUN);
      logger.info(
        { count: articles.length },
        "articleScheduler: generation complete"
      );
    } catch (err) {
      logger.error({ err }, "articleScheduler: generation failed");
    }
  });

  logger.info(
    { schedule, articlesPerRun: ARTICLES_PER_RUN },
    "articleScheduler: registered (runs every 3 days at 03:00)"
  );
}
