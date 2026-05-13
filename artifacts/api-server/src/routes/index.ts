import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import bookingsRouter from "./bookings";
import doctorsRouter from "./doctors";
import adminRouter from "./admin";
import inquiriesRouter from "./inquiries";
import subscriptionsRouter from "./subscriptions";
import stripeRouter from "./stripe";
import placementsRouter from "./placements";
import articlesRouter from "./articles";
import contactRouter from "./contact";
import clinicsRouter from "./clinics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(bookingsRouter);
router.use(doctorsRouter);
router.use(adminRouter);
router.use(inquiriesRouter);
router.use(subscriptionsRouter);
router.use(stripeRouter);
router.use(placementsRouter);
router.use(articlesRouter);
router.use(contactRouter);
router.use(clinicsRouter);

export default router;
