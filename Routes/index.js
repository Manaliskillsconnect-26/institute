import express from "express";
import instituteRoutes from "./v1/instituteRoutes.js";

const router = express.Router();

router.use("/v1/institute", instituteRoutes);

export default router;
