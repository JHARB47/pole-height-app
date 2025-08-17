// Utility for detecting missing/invalid fields before generating permit packs

/**
 * Detects missing or invalid fields from a permit summary.
 * Returns a string[] of issue descriptions.
 * @param {object} summary - The object produced by makePermitSummary
 * @returns {string[]}
 */
export function detectPermitIssues(summary) {
  const issues = [];
  if (!summary || typeof summary !== 'object') return ['Invalid summary'];
  if (!summary.job?.name) issues.push('Missing job.name');
  if (!summary.job?.jobNumber) issues.push('Missing job.jobNumber');
  if (!summary.job?.applicant) issues.push('Missing job.applicant');
  if (!summary.pole?.heightFt) issues.push('Missing pole.heightFt');
  if (!summary.power?.heightFt) issues.push('Missing power.heightFt');
  if (!summary.pole?.gps?.lat || !summary.pole?.gps?.lon) issues.push('Missing pole GPS coordinates');
  if (!summary.span?.lengthFt) issues.push('Missing span.lengthFt');
  if (summary.span?.midspanFt == null) issues.push('Missing span.midspanFt');
  if (!summary.span?.targetFt) issues.push('Missing span.targetFt');

  // Environment-specific ground clearance checks based on profile targets
  const env = summary.environment;
  const p = summary.profile || {};
  const targetFt = toNum(summary.span?.targetFt);
  const computedGC = toNum(summary.span?.computedGroundClearanceFt);
  const mid = toNum(summary.span?.midspanFt);
  const checks = [
    { key: 'envWVHighwayFt', envValue: 'wvHighway', fallback: 18 },
    { key: 'envPAHighwayFt', envValue: 'paHighway', fallback: 18 },
    { key: 'envOHHighwayFt', envValue: 'ohHighway', fallback: 18 },
    { key: 'envMDHighwayFt', envValue: 'mdHighway', fallback: 18 },
    { key: 'envRailroadFt', envValue: 'railroad', fallback: 27 },
    { key: 'envInterstateNewCrossingFt', envValue: 'interstateNewCrossing', fallback: 21 },
    { key: 'envInterstateFt', envValue: 'interstate', fallback: undefined },
    { key: 'envRoadFt', envValue: 'road', fallback: undefined },
  ];
  const row = checks.find(c => c.envValue === env);
  if (row) {
    const profVal = toNum(p[row.key]);
    const req = Number.isFinite(profVal) ? profVal : row.fallback;
    if (Number.isFinite(req)) {
      if (Number.isFinite(targetFt) && targetFt < req) {
        issues.push(`${labelForEnv(env)} ground clearance target below ${req} ft`);
      }
      if (Number.isFinite(computedGC) && computedGC < req) {
        issues.push(`Computed ground clearance below ${req} ft`);
      }
    }
  }

  // Midspan should meet or exceed target
  if (Number.isFinite(mid) && Number.isFinite(targetFt) && mid < targetFt) {
    issues.push(`Midspan (${mid} ft) below target (${targetFt} ft)`);
  }

  // Minimum communication attach height if defined in profile
  const minAttach = toNum(p.minCommAttachFt);
  const attach = toNum(summary.attach?.proposedFt);
  if (Number.isFinite(minAttach) && Number.isFinite(attach) && attach < minAttach) {
    issues.push(`Proposed attach below minimum ${minAttach} ft`);
  }
  return issues;
}

export default { detectPermitIssues };

// Helpers
function toNum(v) {
  if (typeof v === 'number') return v;
  if (v == null) return NaN;
  const s = String(v);
  // quick parse for formats like '35ft 0in'
  const ftMatch = s.match(/(-?\d+(?:\.\d+)?)\s*ft/);
  const inMatch = s.match(/(-?\d+(?:\.\d+)?)\s*in/);
  if (ftMatch || inMatch) {
    const ft = ftMatch ? parseFloat(ftMatch[1]) : 0;
    const inches = inMatch ? parseFloat(inMatch[1]) : 0;
    return ft + (inches / 12);
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function labelForEnv(env) {
  switch (env) {
    case 'wvHighway': return 'WV Highway';
  case 'paHighway': return 'PA Highway';
  case 'ohHighway': return 'OH Highway';
  case 'mdHighway': return 'MD Highway';
    case 'railroad': return 'Railroad';
    case 'interstate': return 'Interstate';
    case 'interstateNewCrossing': return 'Interstate (New Crossing)';
    case 'road': return 'Road';
    default: return 'Environment';
  }
}
