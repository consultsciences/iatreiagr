import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import bookingsRouter from "./bookings";
import doctorsRouter from "./doctors";
import adminRouter from "./admin";
import inquiriesRouter from "./inquiries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(bookingsRouter);
router.use(doctorsRouter);
router.use(adminRouter);
router.use(inquiriesRouter);

export default router;
