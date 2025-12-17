// @ts-nocheck
import express from 'express'

// Minimal placeholder calculations router to satisfy imports during tests.
const router = express.Router()

router.get('/', (_req, res) => {
  res.status(501).json({ error: 'Calculations routes not implemented' })
})

export { router as calculationsRouter }
