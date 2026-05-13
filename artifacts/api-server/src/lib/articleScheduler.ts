import cron from "node-cron";
import { generateArticles } from "./articleGenerator";
import { generateListings } from "./listingGenerator";
import { logger } from "./logger";

const ARTICLES_PER_RUN = 4;
const LISTINGS_PER_RUN = 5;

export function startArticleScheduler() {
  // Articles: every 3 days at 03:00
  const articleSchedule = "0 3 */3 * *";
  cron.schedule(articleSchedule, async () => {
    logger.info("articleScheduler: starting scheduled article generation");
    try {
      const articles = await generateArticles(ARTICLES_PER_RUN);
      logger.info({ count: articles.length }, "articleScheduler: generation complete");
    } catch (err) {
      logger.error({ err }, "articleScheduler: generation failed");
    }
  });

  // Listings: every 7 days at 04:00
  const listingSchedule = "0 4 */7 * *";
  cron.schedule(listingSchedule, async () => {
    logger.info("listingScheduler: starting scheduled listing generation");
    try {
      const listings = await generateListings(LISTINGS_PER_RUN);
      logger.info({ count: listings.length }, "listingScheduler: generation complete");
    } catch (err) {
      logger.error({ err }, "listingScheduler: generation failed");
    }
  });

  logger.info(
    { articleSchedule, listingSchedule, articlesPerRun: ARTICLES_PER_RUN, listingsPerRun: LISTINGS_PER_RUN },
    "Schedulers registered"
  );
}
