import express from "express";
import { getStore, listStores } from "../controllers/storefrontController.js";

// Public vendor storefronts (no auth)
const router = express.Router();
router.get("/", listStores);
router.get("/:slug", getStore);
export default router;
