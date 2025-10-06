import { z } from "zod";

// Schemas aligned with importer output field names
export const PoleSchema = z.object({
  id: z.string().optional(),
  latitude: z.union([z.number().finite(), z.null()]).optional(),
  longitude: z.union([z.number().finite(), z.null()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
  class: z.string().optional(),
  powerHeight: z.union([z.number(), z.string()]).optional(),
  voltage: z.string().optional(),
  hasTransformer: z.boolean().optional(),
  incomingBearingDeg: z.number().min(0).max(360).optional(),
  outgoingBearingDeg: z.number().min(0).max(360).optional(),
  PULL_ft: z.number().min(0).optional(),
});

export const SpanSchema = z.object({
  id: z.string().optional(),
  fromId: z.any().optional(),
  toId: z.any().optional(),
  length: z.number().min(0).optional(),
  proposedAttach: z.union([z.number(), z.string()]).optional(),
  environment: z.string().optional(),
  incomingBearingDeg: z.number().min(0).max(360).optional(),
  outgoingBearingDeg: z.number().min(0).max(360).optional(),
  PULL_ft: z.number().min(0).optional(),
});

export function validatePoles(poles) {
  if (!Array.isArray(poles))
    return { errors: ["Poles must be an array"], data: [] };
  const errors = [];
  const data = [];
  poles.forEach((p, idx) => {
    const r = PoleSchema.safeParse(p);
    if (r.success) data.push(r.data);
    else
      errors.push(
        `Pole[${idx}]: ${r.error.issues.map((i) => i.message).join("; ")}`,
      );
  });
  return { errors, data };
}

export function validateSpans(spans) {
  if (!Array.isArray(spans))
    return { errors: ["Spans must be an array"], data: [] };
  const errors = [];
  const data = [];
  spans.forEach((s, idx) => {
    const r = SpanSchema.safeParse(s);
    if (r.success) data.push(r.data);
    else
      errors.push(
        `Span[${idx}]: ${r.error.issues.map((i) => i.message).join("; ")}`,
      );
  });
  return { errors, data };
}
