// @ts-nocheck
import express from "express";

// Minimal placeholder router to satisfy imports during tests.
// Replace with full geospatial implementation when available.
const router = express.Router();

router.get("/", (_req, res) => {
  res.status(501).json({ error: "Geospatial routes not implemented" });
});

export { router as geospatialRouter };
