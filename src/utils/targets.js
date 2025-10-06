// Utility helpers for environment-based ground clearance targets

/**
 * Returns the ground clearance target (in feet) for a given environment based on the submission profile.
 * @param {object} profile - Effective submission profile with env*Ft fields
 * @param {string} env - Environment key
 * @returns {number|undefined}
 */
export function getEnvTarget(profile, env) {
  if (!profile || !env) return undefined;
  const map = {
    road: profile.envRoadFt,
    residential: profile.envResidentialFt,
    pedestrian: profile.envPedestrianFt,
    field: profile.envFieldFt,
    residentialYard: profile.envResidentialYardFt,
    residentialDriveway: profile.envResidentialDrivewayFt,
    nonResidentialDriveway: profile.envNonResidentialDrivewayFt,
    waterway: profile.envWaterwayFt,
    wvHighway: profile.envWVHighwayFt,
    interstate: profile.envInterstateFt,
    interstateNewCrossing: profile.envInterstateNewCrossingFt,
    railroad: profile.envRailroadFt,
  };
  const v = map[env];
  return Number.isFinite(v) ? Number(v) : undefined;
}

/**
 * Computes the controlling (maximum) ground clearance target across segments.
 * Falls back to the target for the provided fallback environment when segments are empty.
 * @param {object} profile - Effective submission profile
 * @param {Array<{env:string, portion?:number}>} segments - Segment list with environments
 * @param {string} fallbackEnv - Environment to use if no segments provided
 * @returns {number|null}
 */
export function controllingGroundTarget(profile, segments, fallbackEnv) {
  if (!Array.isArray(segments) || !segments.length) {
    const t = getEnvTarget(profile, fallbackEnv);
    return Number.isFinite(t) ? Number(t) : null;
  }
  let maxFt = 0;
  for (const seg of segments) {
    const t = getEnvTarget(profile, seg?.env || fallbackEnv);
    if (Number.isFinite(t)) maxFt = Math.max(maxFt, Number(t));
  }
  return maxFt || null;
}

/**
 * Gets the controlling target from cached midspans matching the given environment.
 * Falls back to the environment target from the profile if none available.
 * @param {Array<{environment?:string,targetFt?:number}>} cachedMidspans
 * @param {string} env
 * @param {object} profile
 * @returns {number|null}
 */
export function maxTargetFromCached(cachedMidspans, env, profile) {
  const list = Array.isArray(cachedMidspans) ? cachedMidspans : [];
  const filtered = list.filter((m) => (m?.environment || "") === env);
  let max = -Infinity;
  for (const m of filtered) {
    const v = Number(m?.targetFt);
    if (Number.isFinite(v)) max = Math.max(max, v);
  }
  if (max !== -Infinity) return max;
  const t = getEnvTarget(profile, env);
  return Number.isFinite(t) ? Number(t) : null;
}
