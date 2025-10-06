// targets helpers inlined for summary to minimize coupling

/**
 * Build a permit summary object from core inputs.
 * @param {object} params
 * @param {'wvHighway'|'railroad'|string} params.env
 * @param {object} params.results - computeAnalysis results
 * @param {object} params.job - current job object
 * @param {object} params.effectiveProfile - merged submission profile
 * @param {Array} params.cachedMidspans - store.cachedMidspans
 * @param {object} params.store - minimal fields for metadata (optional)
 */
export function makePermitSummary({
  env,
  results,
  job,
  effectiveProfile,
  cachedMidspans,
  store,
}) {
  if (!results) throw new Error("results required");
  const type =
    env === "railroad"
      ? "CSX Railroad Crossing"
      : env === "wvHighway"
        ? "WVDOH MM109"
        : "General";
  // Prefer cached midspans. If none available, treat target as computed (results.clearances)
  const cacheForEnv = (
    Array.isArray(cachedMidspans) ? cachedMidspans : []
  ).filter((m) => (m?.environment || "") === env);
  const targetNumbers = cacheForEnv
    .map((m) => Number(m?.targetFt))
    .filter((v) => Number.isFinite(v));
  const controllingEnvTarget = targetNumbers.length
    ? Math.max(...targetNumbers)
    : null;
  const targetSource = targetNumbers.length ? "cachedMidspans" : "computed";
  const controllingEntry = targetNumbers.length
    ? cacheForEnv.reduce(
        (best, m) =>
          Number(m?.targetFt) > Number(best?.targetFt || -Infinity) ? m : best,
        null,
      )
    : null;
  return {
    type,
    job: {
      id: job?.id || "",
      name: job?.name || store?.projectName || "",
      applicant: job?.applicantName || store?.applicantName || "",
      jobNumber: job?.jobNumber || store?.jobNumber || "",
      owner: job?.jobOwner || store?.jobOwner || "",
      commCompany: job?.commCompany || "",
      submissionProfileName: job?.submissionProfileName || "",
    },
    profile: { ...effectiveProfile },
    environment: env,
    pole: {
      heightFt: Number(store?.poleHeight) || 0,
      class: store?.poleClass || "",
      gps: { lat: store?.poleLatitude || "", lon: store?.poleLongitude || "" },
    },
    power: {
      voltage: store?.existingPowerVoltage,
      heightFt: store?.existingPowerHeight,
    },
    span: {
      lengthFt: results.span?.spanFt,
      midspanFt: results.span?.midspanFt,
      targetFt:
        controllingEnvTarget != null
          ? controllingEnvTarget
          : results.clearances?.groundClearance,
      computedGroundClearanceFt: results.clearances?.groundClearance,
      targetSource,
      // Geospatial midspan (from cached controlling entry when available)
      midLatitude: controllingEntry?.midLat || "",
      midLongitude: controllingEntry?.midLon || "",
      endpoints: {
        from: controllingEntry?.fromId
          ? {
              id: controllingEntry.fromId,
              latitude: controllingEntry?.fromLat || "",
              longitude: controllingEntry?.fromLon || "",
            }
          : null,
        to: controllingEntry?.toId
          ? {
              id: controllingEntry.toId,
              latitude: controllingEntry?.toLat || "",
              longitude: controllingEntry?.toLon || "",
            }
          : null,
      },
    },
    attach: {
      proposedFt: results.attach?.proposedAttachFt,
      basis: results.attach?.recommendation?.basis,
      detail: results.attach?.recommendation?.detail,
    },
    timestamps: { generatedAt: new Date().toISOString() },
  };
}
