// Default PDF overlay layouts for common agency forms.
// Coordinates are in PDF user space points (origin bottom-left).
// These presets aim to be "close" for standard letter-size forms; small tweaks
// may be needed for latest versions or scanned variants.

/**
 * Build a key for picking a layout based on PDF metadata.
 * meta example: { pages: 1, firstPage: { width: 612, height: 792 } }
 */
function metaKey(meta) {
  if (!meta || !meta.firstPage) return "unknown";
  const w = Math.round(meta.firstPage.width);
  const h = Math.round(meta.firstPage.height);
  return `${meta.pages}:${w}x${h}`; // e.g., '1:612x792'
}

// Layout registry keyed by environment, then optional metaKey
// Each layout is an array of { key, pageIndex, x, y, size }
const registry = {
  wvHighway: {
    // Letter portrait
    "1:612x792": [
      { key: "applicant", pageIndex: 0, x: 120, y: 720, size: 10 },
      { key: "jobName", pageIndex: 0, x: 120, y: 704, size: 10 },
      { key: "jobNumber", pageIndex: 0, x: 120, y: 688, size: 10 },
      { key: "poleLatitude", pageIndex: 0, x: 440, y: 720, size: 10 },
      { key: "poleLongitude", pageIndex: 0, x: 440, y: 704, size: 10 },
      {
        key: "targetGroundClearanceFt",
        pageIndex: 0,
        x: 440,
        y: 560,
        size: 10,
      },
      { key: "spanLengthFt", pageIndex: 0, x: 440, y: 544, size: 10 },
      { key: "midspanFt", pageIndex: 0, x: 440, y: 528, size: 10 },
      { key: "proposedAttachFt", pageIndex: 0, x: 440, y: 512, size: 10 },
    ],
    default: [
      { key: "applicant", pageIndex: 0, x: 110, y: 710, size: 10 },
      { key: "jobName", pageIndex: 0, x: 110, y: 694, size: 10 },
      { key: "jobNumber", pageIndex: 0, x: 110, y: 678, size: 10 },
      { key: "poleLatitude", pageIndex: 0, x: 420, y: 710, size: 10 },
      { key: "poleLongitude", pageIndex: 0, x: 420, y: 694, size: 10 },
    ],
  },
  paHighway: {
    "1:612x792": [
      { key: "applicant", pageIndex: 0, x: 120, y: 730, size: 10 },
      { key: "commCompany", pageIndex: 0, x: 120, y: 714, size: 10 },
      { key: "jobName", pageIndex: 0, x: 120, y: 698, size: 10 },
      { key: "jobNumber", pageIndex: 0, x: 120, y: 682, size: 10 },
      { key: "poleLatitude", pageIndex: 0, x: 440, y: 730, size: 10 },
      { key: "poleLongitude", pageIndex: 0, x: 440, y: 714, size: 10 },
      {
        key: "targetGroundClearanceFt",
        pageIndex: 0,
        x: 440,
        y: 560,
        size: 10,
      },
    ],
    default: [
      { key: "applicant", pageIndex: 0, x: 110, y: 720, size: 10 },
      { key: "jobName", pageIndex: 0, x: 110, y: 704, size: 10 },
    ],
  },
  ohHighway: {
    "1:612x792": [
      { key: "applicant", pageIndex: 0, x: 120, y: 730, size: 10 },
      { key: "jobName", pageIndex: 0, x: 120, y: 714, size: 10 },
      { key: "jobNumber", pageIndex: 0, x: 120, y: 698, size: 10 },
      {
        key: "targetGroundClearanceFt",
        pageIndex: 0,
        x: 440,
        y: 560,
        size: 10,
      },
    ],
    default: [
      { key: "applicant", pageIndex: 0, x: 110, y: 720, size: 10 },
      { key: "jobName", pageIndex: 0, x: 110, y: 704, size: 10 },
    ],
  },
  mdHighway: {
    "1:612x792": [
      { key: "applicant", pageIndex: 0, x: 120, y: 730, size: 10 },
      { key: "jobName", pageIndex: 0, x: 120, y: 714, size: 10 },
      { key: "jobNumber", pageIndex: 0, x: 120, y: 698, size: 10 },
      { key: "poleLatitude", pageIndex: 0, x: 440, y: 730, size: 10 },
      { key: "poleLongitude", pageIndex: 0, x: 440, y: 714, size: 10 },
    ],
    default: [
      { key: "applicant", pageIndex: 0, x: 110, y: 720, size: 10 },
      { key: "jobName", pageIndex: 0, x: 110, y: 704, size: 10 },
    ],
  },
  railroad: {
    "1:612x792": [
      { key: "applicant", pageIndex: 0, x: 120, y: 730, size: 10 },
      { key: "commCompany", pageIndex: 0, x: 120, y: 714, size: 10 },
      { key: "jobName", pageIndex: 0, x: 120, y: 698, size: 10 },
      {
        key: "targetGroundClearanceFt",
        pageIndex: 0,
        x: 440,
        y: 560,
        size: 10,
      },
      { key: "spanLengthFt", pageIndex: 0, x: 440, y: 544, size: 10 },
      { key: "midspanFt", pageIndex: 0, x: 440, y: 528, size: 10 },
      { key: "proposedAttachFt", pageIndex: 0, x: 440, y: 512, size: 10 },
    ],
    default: [
      { key: "applicant", pageIndex: 0, x: 110, y: 720, size: 10 },
      { key: "jobName", pageIndex: 0, x: 110, y: 704, size: 10 },
    ],
  },
};

export function getLayoutFor(env, meta) {
  const bucket = registry[env] || {};
  const key = metaKey(meta);
  return bucket[key] || bucket.default || [];
}

export default { getLayoutFor };
