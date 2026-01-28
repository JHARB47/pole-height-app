import { logCalculationFailed } from "./telemetry.js";

// Core math helpers (deduplicated)
export function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}
export function normalizeBearingDeg(bearing) {
  let b = bearing % 360;
  if (b < 0) b += 360;
  return b;
}

export function normalizeIncludedAngleDeg(bearingA, bearingB) {
  // θ = min(|Δbearing|, 360 - |Δbearing|), clamped [0, 180]
  const a = normalizeBearingDeg(bearingA);
  const b = normalizeBearingDeg(bearingB);
  const delta = Math.abs(a - b);
  const theta = Math.min(delta, 360 - delta);
  return clamp(theta, 0, 180);
}

export function pullFromAngleDeg(thetaDeg, baseSpanFt = 100) {
  const theta = clamp(thetaDeg, 0, 180);
  const pull = baseSpanFt * Math.sin(degToRad(theta / 2));
  return clamp(pull, 0, baseSpanFt);
}
export function angleDegFromPull(pullFt, baseSpanFt = 100) {
  const p = clamp(pullFt, 0, baseSpanFt);
  const ratio = p / baseSpanFt;
  const thetaRad = 2 * Math.asin(ratio);
  return clamp(radToDeg(thetaRad), 0, 180);
}
export function computePullAutofill({
  incomingBearingDeg,
  outgoingBearingDeg,
  baseSpanFt = 100,
}) {
  const theta = normalizeIncludedAngleDeg(
    incomingBearingDeg,
    outgoingBearingDeg,
  );
  const pullFt = pullFromAngleDeg(theta, baseSpanFt);
  return { thetaDeg: theta, pullFt };
}
export const examples = {
  zero: pullFromAngleDeg(0),
  sixty: pullFromAngleDeg(60),
  oneTwenty: pullFromAngleDeg(120),
  oneEighty: pullFromAngleDeg(180),
};
// Unified calculations utility (ES module) with ft/in parsing & formatting

// ---------- formatting helpers ----------
export function parseFeet(value) {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value).trim().toLowerCase();
  if (s === "") return null;

  // inches only patterns: 10", 10'', 10in
  const inchesOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:""|"|in)$/i);
  if (inchesOnly) return (parseFloat(inchesOnly[1]) || 0) / 12;

  // feet only patterns: 15', 15ft
  const feetOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)$/i);
  if (feetOnly) return parseFloat(feetOnly[1]) || 0;

  // feet and inches patterns: 35'6", 35' 6", 35ft 6in, 35 ft 6 in
  const ftInMatch = s.match(
    /^(\d+(?:\.\d+)?)\s*(?:'|ft)\s*(\d+(?:\.\d+)?)\s*(?:""|"|in)?$/i,
  );
  if (ftInMatch) {
    const ft = parseFloat(ftInMatch[1]) || 0;
    const inch = parseFloat(ftInMatch[2] ?? "0") || 0;
    return ft + inch / 12;
  }

  // fallback to plain number (assume feet)
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatFeetInches(
  feet,
  { compact = false, tickMarks = false } = {},
) {
  if (feet == null || Number.isNaN(feet)) return "--";
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  const sign = isNeg ? "-" : "";

  if (tickMarks) {
    return compact ? `${sign}${ft}' ${inch}"` : `${sign}${ft}' ${inch}"`;
  } else {
    return compact ? `${sign}${ft}' ${inch}"` : `${sign}${ft}ft ${inch}in`;
  }
}

// Additional formatting function specifically for tick marks
export function formatFeetInchesTickMarks(feet) {
  if (feet == null || Number.isNaN(feet)) return "--";
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  const sign = isNeg ? "-" : "";
  return `${sign}${ft}' ${inch}"`;
}

// Additional formatting function specifically for verbose format
export function formatFeetInchesVerbose(feet) {
  if (feet == null || Number.isNaN(feet)) return "--";
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  const sign = isNeg ? "-" : "";
  return `${sign}${ft}ft ${inch}in`;
}

// ---------- defaults ----------
export const DEFAULTS = {
  cableTypes: [
    {
      label: 'ADSS (0.5")',
      value: "adss",
      weight: 0.08,
      tension: 1200,
      diameter: 0.5,
    },
    {
      label: 'Coax (0.75")',
      value: "coax",
      weight: 0.12,
      tension: 1500,
      diameter: 0.75,
    },
    {
      label: 'Copper (0.5")',
      value: "copper",
      weight: 0.1,
      tension: 1400,
      diameter: 0.5,
    },
    {
      label: 'Triplex (1.0")',
      value: "triplex",
      weight: 0.2,
      tension: 1800,
      diameter: 1.0,
    },
    {
      label: 'Generic Comm (0.6")',
      value: "communication",
      weight: 0.1,
      tension: 1400,
      diameter: 0.6,
    },
    {
      label: 'Messenger-lashed Fiber (0.6")',
      value: "messenger_fiber",
      weight: 0.14,
      tension: 1600,
      diameter: 0.6,
    },
    {
      label: 'Overlash on Existing Messenger (0.6")',
      value: "overlash",
      weight: 0.18,
      tension: 1800,
      diameter: 0.6,
    },
  ],
  presets: {
    firstEnergy: {
      label: "FirstEnergy",
      value: "firstEnergy",
      voltage: "distribution",
      minTopSpace: 2.0,
      roadClearance: 18.0,
      commToPower: 44 / 12,
      asBuiltTolerances: { attachHeightIn: 2 },
    },
    firstEnergyMonPower: {
      label: "FirstEnergy - Mon Power",
      value: "firstEnergyMonPower",
      voltage: "distribution",
      minTopSpace: 2.0,
      roadClearance: 18.0,
      commToPower: 44 / 12,
      asBuiltTolerances: { attachHeightIn: 2 },
    },
    pse: {
      label: "PSE",
      value: "pse",
      voltage: "distribution",
      minTopSpace: 2.0,
      roadClearance: 18.0,
      commToPower: 42 / 12,
      asBuiltTolerances: { attachHeightIn: 4 },
    },
    duke: {
      label: "Duke",
      value: "duke",
      voltage: "distribution",
      minTopSpace: 2.0,
      roadClearance: 18.0,
      commToPower: 40 / 12,
      asBuiltTolerances: { attachHeightIn: 4 },
    },
    nationalGrid: {
      label: "National Grid",
      value: "nationalGrid",
      voltage: "distribution",
      minTopSpace: 2.0,
      roadClearance: 18.0,
      commToPower: 40 / 12,
      asBuiltTolerances: { attachHeightIn: 4 },
    },
  },
};

// FirstEnergy family owner name hints for detection (case-insensitive substring match)
export const FIRST_ENERGY_OWNER_HINTS = [
  "firstenergy",
  "mon power",
  "monpower",
  "penelec",
  "potomac edison",
  "west penn power",
  "jcp&l",
  "jersey central power",
  "ohio edison",
  "illuminating company",
  "toledo edison",
];

// ---------- core calcs ----------
export function getNESCClearances(
  voltage = "communication",
  environment = "road",
) {
  const clearances = {
    communication: {
      groundClearance: environment === "road" ? 15.5 : 9.5,
      roadClearance: 18.0,
      powerClearanceDistribution: 40 / 12,
      powerClearanceTransmission: 6.0,
      minimumPoleTopSpace: 1.0,
      commToCommVertical: 1.0,
      commToCommMidspan: 0.5,
      neutralClearance: 20 / 12,
      dropWireClearance: 6 / 12,
    },
    distribution: {
      groundClearance: environment === "road" ? 23.0 : 18.0,
      roadClearance: 25.0,
      powerClearanceDistribution: 0,
      powerClearanceTransmission: 4.0,
      minimumPoleTopSpace: 2.0,
    },
    transmission: {
      groundClearance: environment === "road" ? 28.5 : 23.0,
      roadClearance: 30.0,
      powerClearanceDistribution: 0,
      powerClearanceTransmission: 6.0,
      minimumPoleTopSpace: 4.0,
    },
  };
  return clearances[voltage] || clearances.communication;
}

export function applyPresetToClearances(clearances, presetKey) {
  if (!presetKey) return clearances;
  const preset = DEFAULTS.presets[presetKey];
  if (!preset) return clearances;
  const updated = { ...clearances };
  if (typeof preset.minTopSpace === "number")
    updated.minimumPoleTopSpace = preset.minTopSpace;
  if (typeof preset.roadClearance === "number")
    updated.roadClearance = preset.roadClearance;
  if (typeof preset.commToPower === "number")
    updated.powerClearanceDistribution = preset.commToPower;
  return updated;
}

export function applyPresetObject(clearances, presetObj) {
  if (!presetObj) return clearances;
  const updated = { ...clearances };
  if (typeof presetObj.minTopSpace === "number")
    updated.minimumPoleTopSpace = presetObj.minTopSpace;
  if (typeof presetObj.roadClearance === "number")
    updated.roadClearance = presetObj.roadClearance;
  if (typeof presetObj.commToPower === "number")
    updated.powerClearanceDistribution = presetObj.commToPower;
  return updated;
}

export function resultsToCSV(
  results,
  warnings = [],
  makeReadyNotes = "",
  { useTickMarks = false } = {},
) {
  if (!results) return "";
  const lines = [];
  const fmt = useTickMarks ? formatFeetInchesTickMarks : formatFeetInches;

  lines.push("Section,Field,Value");
  lines.push(`Pole,Height,${fmt(results.pole.inputHeight)}`);
  lines.push(`Pole,Buried,${fmt(results.pole.buriedFt)}`);
  lines.push(`Pole,Above Ground,${fmt(results.pole.aboveGroundFt)}`);
  if (results.pole.latitude != null && results.pole.longitude != null) {
    lines.push(`Pole,Latitude,${results.pole.latitude}`);
    lines.push(`Pole,Longitude,${results.pole.longitude}`);
  }
  lines.push(
    `Attach,Proposed,${useTickMarks ? formatFeetInchesTickMarks(results.attach.proposedAttachFt) : results.attach.proposedAttachFmt}`,
  );
  if (results.attach?.recommendation) {
    lines.push(`Attach,Rule Basis,${results.attach.recommendation.basis}`);
    lines.push(`Attach,Rule Detail,${results.attach.recommendation.detail}`);
    if (results.attach.recommendation.clearanceIn != null)
      lines.push(
        `Attach,Owner Clearance (in),${results.attach.recommendation.clearanceIn}`,
      );
  }
  lines.push(`Span,Length,${results.span.spanFt} ft`);
  lines.push(`Span,Wind,${results.span.wind} mph`);
  lines.push(
    `Span,Sag,${useTickMarks ? formatFeetInchesTickMarks(results.span.sagFt) : results.span.sagFmt}`,
  );
  lines.push(
    `Span,Midspan,${useTickMarks ? formatFeetInchesTickMarks(results.span.midspanFt) : results.span.midspanFmt}`,
  );
  lines.push(
    `Clearances,Ground Target,${fmt(results.clearances.groundClearance)}`,
  );
  lines.push(`Clearances,Road Target,${fmt(results.clearances.roadClearance)}`);
  if (results.makeReadyTotal != null)
    lines.push(`Make-ready,Total,$${results.makeReadyTotal}`);
  if (results.guy) {
    lines.push(`Guying,Required,${results.guy.required ? "Yes" : "No"}`);
    lines.push(`Guying,Tension,${Math.round(results.guy.tension || 0)} lb`);
    lines.push(`Guying,Angle,${Math.round(results.guy.angle || 0)} deg`);
  }
  if (warnings?.length) lines.push(`Warnings,Count,${warnings.length}`);
  if (makeReadyNotes)
    lines.push(`Notes,Make-ready,"${makeReadyNotes.replace(/"/g, '""')}"`);
  return lines.join("\n");
}

export function getPoleBurialData(height, poleClass = "") {
  const h = Number(height) || 0;
  const buried = Math.max(5, h * 0.1 + 2);
  const aboveGround = Math.max(0, h - buried);
  const recommendedClass =
    h <= 30
      ? "Class 6 typical"
      : h <= 35
        ? "Class 4-5 typical"
        : h <= 40
          ? "Class 3-4 typical"
          : h <= 45
            ? "Class 2-3 typical"
            : "Class 1-2 typical";
  const classInfo = poleClass || recommendedClass;
  return { buried, aboveGround, classInfo, recommendedClass };
}

export function calculateSag(
  spanFt,
  weightLbsPerFt,
  tensionLbs,
  windSpeedMph = 90,
  cableDiameterIn = 0.5,
  iceThicknessIn = 0,
) {
  const L = Number(spanFt) || 0;
  const T = Math.max(1, Number(tensionLbs) || 1200);
  const dFt =
    Math.max(
      0,
      (Number(cableDiameterIn) || 0.5) + 2 * (Number(iceThicknessIn) || 0),
    ) / 12;
  const wVert = Math.max(0, Number(weightLbsPerFt) || 0.1); // lb/ft
  const qWind = 0.00256 * Math.pow(Math.max(0, Number(windSpeedMph) || 0), 2);
  const wHoriz = qWind * dFt; // lb/ft projected
  const wEff = Math.sqrt(wVert * wVert + wHoriz * wHoriz);
  const sag = (wEff * L * L) / (8 * T); // ft
  return sag;
}

export function calculateDownGuy(
  poleAboveGroundFt,
  attachmentHeightFt,
  cableData,
  spanLengthFt,
  windSpeedMph = 90,
  pullDirectionDeg = 0,
) {
  if (!cableData || !spanLengthFt || !attachmentHeightFt) return null;
  const leverArm = Number(attachmentHeightFt) || 0;
  const span = Number(spanLengthFt) || 0;
  const wind = Number(windSpeedMph) || 0;
  const T = cableData.tension || 1500;
  const windPressure =
    0.00256 * Math.pow(wind, 2) * ((cableData.diameter || 0.6) / 12);
  const windLoadOnSpan = windPressure * span;
  const horizontalLoad = T * 0.1 + windLoadOnSpan; // approx unbalanced + wind
  const guyAttach = Math.max(1, Number(poleAboveGroundFt) || 1) * 0.85;
  const leadDistance = guyAttach * 0.5; // typical lead
  const guyTension = (horizontalLoad * leverArm) / Math.max(1, guyAttach);
  const guyAngle =
    Math.atan(guyAttach / Math.max(0.1, leadDistance)) * (180 / Math.PI);
  const required = guyTension > 500;
  const totalCost = required
    ? 350 + Math.min(650, Math.round(guyTension / 10))
    : 0;
  return {
    required,
    tension: guyTension,
    angle: guyAngle,
    leadDistance,
    guyHeight: guyAttach,
    pullDirection: pullDirectionDeg,
    totalCost,
  };
}

export function analyzeMakeReadyImpact(
  existingFt,
  proposedFt,
  minSeparationFt,
) {
  const existing = Number(existingFt);
  const proposed = Number(proposedFt);
  const minSep = Number(minSeparationFt);
  if (
    !Number.isFinite(existing) ||
    !Number.isFinite(proposed) ||
    !Number.isFinite(minSep)
  )
    return null;
  const actualSep = Math.abs(existing - proposed);
  const makeReadyRequired = actualSep < minSep;
  const adjustmentNeeded = makeReadyRequired ? minSep - actualSep : 0;
  return {
    makeReadyRequired,
    adjustmentNeeded,
    recommendedHeight: makeReadyRequired ? existing - minSep : proposed,
  };
}

export function recommendPoleReplacement(poleHeightFt, requiredAboveGroundFt) {
  const h = Number(poleHeightFt) || 0;
  const req = Number(requiredAboveGroundFt) || 0;
  const margin = h - req;
  const replace = margin < 2; // if less than 2ft margin, recommend replacement
  const suggested = replace ? Math.ceil(req + 4) : h;
  return { replace, suggestedHeight: suggested };
}

// FirstEnergy / utility requirements used by the UI export
export function getFirstEnergyRequirements() {
  return {
    applicationRequirements: [
      "Pole Attachment Agreement executed",
      "SPANS electronic submission required (max 25 poles per application)",
      "Pole profile for each pole attachment point",
      "Site map with route connectivity shown",
      "High resolution photos taken within 30 days",
      "GPS coordinates required if no visible pole tag",
      "Load analysis required for spans exceeding 250 feet",
      "Engineering drawings for complex attachments",
    ],
    prohibitedItems: [
      "Boxing and extension arms not permitted",
      "Additional equipment mounting on pole",
      "Steel transmission structure attachments",
      "Overlashing prohibited in New Jersey territory",
      "Grounding to pole without utility approval",
      "Modifications to existing pole hardware",
    ],
    engineeringChecks: [
      "NESC Table 232-1 compliance verification",
      "Pole loading analysis if span > 250ft or guy required",
      "Make-ready construction cost assessment",
      "Ground clearance verification at midspan",
      "Post-construction inspection scheduling",
      "Storm restoration priority classification",
    ],
    makeReadyProcess: [
      "Utility performs make-ready work",
      "Attacher pays for make-ready costs",
      "Standard make-ready: $150-300 per attachment point",
      "Complex make-ready: $500-1500 per pole",
      "Timeline: 45-90 days after approval",
    ],
    qualityAssurance: [
      "Field verification of pole class and height",
      "Photo documentation of existing conditions",
      "GPS verification within 10 feet of reported coordinates",
      "Clearance measurements using laser rangefinder",
      "As-built documentation within 48 hours of completion",
    ],
    safetyRequirements: [
      "Hard hat, safety glasses, and high-visibility vest required",
      "Traffic control plan for roadway work",
      "Minimum approach distances to energized equipment",
      "Lockout/tagout procedures for utility coordination",
      "Fall protection for work above 6 feet",
    ],
  };
}

// ---------- pure analysis for reuse (UI and batch) ----------
export function computeAnalysis(inputs) {
  // AI: rationale — calculations should never throw; return structured diagnostics instead.
  try {
    const {
      poleHeight,
      poleClass,
      poleLatitude,
      poleLongitude,
      adjacentPoleLatitude,
      adjacentPoleLongitude,
      existingPowerHeight,
      existingPowerVoltage = "distribution",
      spanDistance,
      isNewConstruction,
      adjacentPoleHeight,
      adjacentPowerHeight,
      adjacentProposedAttachFt,
      attachmentType,
      cableDiameter,
      windSpeed,
      spanEnvironment = "road",
      // streetLightHeight,
      dripLoopHeight,
      proposedLineHeight,
      existingLines = [],
      iceThicknessIn,
      hasTransformer,
      presetProfile,
      customMinTopSpace,
      customRoadClearance,
      customCommToPower,
      powerReference,
      jobOwner,
      submissionProfile,
    } = inputs || {};

    const errs = {};
    if (!poleHeight) errs.poleHeight = "Pole height required for analysis";
    if (
      !isNewConstruction &&
      !existingPowerHeight &&
      existingPowerVoltage !== "communication"
    )
      errs.existingPowerHeight =
        "Power wire height required for existing pole analysis";
    if (Object.keys(errs).length) {
      logCalculationFailed({ subsystem: "computeAnalysis", code: "ERR_INPUT" });
      return {
        ok: false,
        errors: errs,
        warnings: [],
        notes: [],
        cost: null,
        results: null,
      };
    }

    const poleData = getPoleBurialData(Number(poleHeight) || 0, poleClass);
    const cableData =
      DEFAULTS.cableTypes.find((c) => c.value === attachmentType) ||
      DEFAULTS.cableTypes[0];
    // If span distance missing, try to compute from geolocation (haversine)
    let spanFt = Number(spanDistance) || 0;
    if (
      !spanFt &&
      Number.isFinite(Number(poleLatitude)) &&
      Number.isFinite(Number(poleLongitude)) &&
      Number.isFinite(Number(adjacentPoleLatitude)) &&
      Number.isFinite(Number(adjacentPoleLongitude))
    ) {
      const toRad = (d) => (Number(d) * Math.PI) / 180;
      const Rm = 6371000;
      const lat1 = Number(poleLatitude),
        lon1 = Number(poleLongitude);
      const lat2 = Number(adjacentPoleLatitude),
        lon2 = Number(adjacentPoleLongitude);
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const meters = Rm * c;
      spanFt = meters * 3.28084;
    }
    const wind = Number(windSpeed) || 90;
    const adjacentPoleFt = Number(adjacentPoleHeight) || 0;
    const proposedFt = parseFeet(proposedLineHeight);
    // streetLightHeight not used in owner rule currently; drip loop governs
    const dripFt = parseFeet(dripLoopHeight);

    // Determine owner context early so we can influence baseline clearances
    const companyNamesEarly = (existingLines || [])
      .map((l) => String(l?.companyName || "").toLowerCase())
      .filter(Boolean);
    const isFEByPresetEarly =
      presetProfile === "firstEnergy" ||
      presetProfile === "firstEnergyMonPower";
    const isFEByCompanyEarly = companyNamesEarly.some((name) =>
      FIRST_ENERGY_OWNER_HINTS.some((h) => name.includes(h)),
    );
    const jobOwnerLcEarly = String(jobOwner || "").toLowerCase();
    const isFEByJobOwnerEarly = jobOwnerLcEarly
      ? FIRST_ENERGY_OWNER_HINTS.some((h) => jobOwnerLcEarly.includes(h))
      : false;
    const isFirstEnergyOwner =
      isFEByPresetEarly || isFEByCompanyEarly || isFEByJobOwnerEarly;

    let clearances = getNESCClearances(existingPowerVoltage, spanEnvironment);
    clearances = applyPresetToClearances(clearances, presetProfile);
    // Owner-type overrides: if FirstEnergy detected by jobOwner/lines/preset, enforce FE-like parameters
    if (isFirstEnergyOwner) {
      // Ensure comm-to-power separation reflects 44" (unless custom override is supplied later)
      clearances.powerClearanceDistribution = Math.max(
        clearances.powerClearanceDistribution || 0,
        44 / 12,
      );
      // Ensure minimum top space at least 2 ft
      clearances.minimumPoleTopSpace = Math.max(
        clearances.minimumPoleTopSpace || 0,
        2.0,
      );
      // Road environments: enforce 18 ft ground target minimum
      if (spanEnvironment === "road") {
        clearances.groundClearance = Math.max(
          clearances.groundClearance || 0,
          18.0,
        );
      }
    }
    // Submission profile overrides (adjustable per utility/region)
    if (submissionProfile && typeof submissionProfile === "object") {
      const {
        commToPowerIn,
        minTopSpaceFt,
        roadClearanceFt,
        envRoadFt,
        envResidentialFt,
        envPedestrianFt,
        envFieldFt,
        envResidentialYardFt,
        envResidentialDrivewayFt,
        envNonResidentialDrivewayFt,
        envWaterwayFt,
        envWVHighwayFt,
        envInterstateFt,
        envInterstateNewCrossingFt,
        envRailroadFt,
      } = submissionProfile;
      if (Number.isFinite(commToPowerIn))
        clearances.powerClearanceDistribution = Math.max(
          clearances.powerClearanceDistribution || 0,
          Number(commToPowerIn) / 12,
        );
      if (Number.isFinite(minTopSpaceFt))
        clearances.minimumPoleTopSpace = Math.max(
          clearances.minimumPoleTopSpace || 0,
          Number(minTopSpaceFt),
        );
      if (Number.isFinite(roadClearanceFt) && spanEnvironment === "road")
        clearances.groundClearance = Math.max(
          clearances.groundClearance || 0,
          Number(roadClearanceFt),
        );
      // Environment-specific midspan target overrides
      if (spanEnvironment === "road" && Number.isFinite(envRoadFt))
        clearances.groundClearance = Number(envRoadFt);
      if (
        spanEnvironment === "residential" &&
        Number.isFinite(envResidentialFt)
      )
        clearances.groundClearance = Number(envResidentialFt);
      if (spanEnvironment === "pedestrian" && Number.isFinite(envPedestrianFt))
        clearances.groundClearance = Number(envPedestrianFt);
      if (spanEnvironment === "field" && Number.isFinite(envFieldFt))
        clearances.groundClearance = Number(envFieldFt);
      if (
        spanEnvironment === "residentialYard" &&
        Number.isFinite(envResidentialYardFt)
      )
        clearances.groundClearance = Number(envResidentialYardFt);
      if (
        spanEnvironment === "residentialDriveway" &&
        Number.isFinite(envResidentialDrivewayFt)
      )
        clearances.groundClearance = Number(envResidentialDrivewayFt);
      if (spanEnvironment === "waterway" && Number.isFinite(envWaterwayFt))
        clearances.groundClearance = Number(envWaterwayFt);
      if (spanEnvironment === "wvHighway" && Number.isFinite(envWVHighwayFt))
        clearances.groundClearance = Number(envWVHighwayFt);
      if (spanEnvironment === "interstate" && Number.isFinite(envInterstateFt))
        clearances.groundClearance = Number(envInterstateFt);
      if (
        spanEnvironment === "interstateNewCrossing" &&
        Number.isFinite(envInterstateNewCrossingFt)
      )
        clearances.groundClearance = Number(envInterstateNewCrossingFt);
      if (
        spanEnvironment === "nonResidentialDriveway" &&
        Number.isFinite(envNonResidentialDrivewayFt)
      )
        clearances.groundClearance = Number(envNonResidentialDrivewayFt);
      if (spanEnvironment === "railroad" && Number.isFinite(envRailroadFt))
        clearances.groundClearance = Number(envRailroadFt);
      // minCommAttachFt is applied after attach height is computed below
    }
    if (customMinTopSpace)
      clearances.minimumPoleTopSpace =
        Number(customMinTopSpace) || clearances.minimumPoleTopSpace;
    if (customRoadClearance)
      clearances.roadClearance =
        Number(customRoadClearance) || clearances.roadClearance;
    if (customCommToPower)
      clearances.powerClearanceDistribution =
        Number(customCommToPower) || clearances.powerClearanceDistribution;

    let localWarnings = [];
    let notes = [];
    let calculatedCost = 0;

    // Determine controlling power feature height

    const heights = [];
    const pushIf = (val, name) => {
      const ft = parseFeet(val);
      if (ft != null && Number.isFinite(ft) && ft > 0)
        heights.push({ name, ft });
    };
    pushIf(existingPowerHeight, "power conductor");
    pushIf(dripLoopHeight, "drip loop");
    // Scan existing lines for neutral/secondary heights
    for (const line of existingLines || []) {
      const t = String(line?.type || "").toLowerCase();
      if (t.includes("neutral")) pushIf(line?.height, "neutral");
      if (t.includes("secondary")) pushIf(line?.height, "secondary");
    }
    heights.sort((a, b) => a.ft - b.ft);
    // Owner-selected reference override
    let controlling = null;
    const findByName = (n) => heights.find((h) => h.name === n) || null;
    switch (powerReference || "auto") {
      case "neutral":
        controlling = findByName("neutral");
        break;
      case "secondary":
        controlling = findByName("secondary");
        break;
      case "dripLoop":
        controlling = findByName("drip loop");
        break;
      case "power":
        controlling = findByName("power conductor");
        break;
      default:
        controlling = heights[0] || null;
        break;
    }
    const powerPresent = !!controlling;
    const hasCommCompany = (existingLines || []).some(
      (l) =>
        String(l?.type || "")
          .toLowerCase()
          .includes("communication") &&
        String(l?.companyName || "").trim().length > 0,
    );
    const commOwnerScenario =
      !powerPresent &&
      (existingPowerVoltage === "communication" || hasCommCompany);

    // Determine effective separation between comm and controlling power-owned element
    // Base on voltage class: transmission uses transmission separation; distribution uses distribution separation
    const baseSeparationFt =
      existingPowerVoltage === "transmission"
        ? clearances.powerClearanceTransmission || 0
        : clearances.powerClearanceDistribution || 0;
    const ownerFloorFt =
      existingPowerVoltage === "transmission"
        ? baseSeparationFt // don't override transmission separation with owner floors
        : isFirstEnergyOwner
          ? 44 / 12
          : 40 / 12;
    const effectiveSeparationFt = Math.max(baseSeparationFt, ownerFloorFt);
    const effectiveSeparationInches = Math.round(effectiveSeparationFt * 12);

    let proposedAttachFt = null;
    let ownerRecommendation = null;
    if (commOwnerScenario) {
      proposedAttachFt = Math.max(0, poleData.aboveGround - 1.0);
      ownerRecommendation = {
        basis: "owner-comm/no-power",
        detail: "1ft below pole top (comm owner, no power measurements)",
        clearanceIn: 12,
        controlling: { name: "pole top", ft: poleData.aboveGround },
      };
      notes.push(
        "Owner rule: No power measurements provided and communication company present — setting proposed attach 1ft below pole top.",
      );
      calculatedCost += isNewConstruction ? 150 : 200;
    } else if (powerPresent) {
      proposedAttachFt = controlling.ft - effectiveSeparationFt;
      ownerRecommendation = {
        basis:
          existingPowerVoltage === "transmission"
            ? "NESC-transmission"
            : isFirstEnergyOwner
              ? "FE"
              : "NESC",
        detail: `${effectiveSeparationInches}" below ${controlling.name}`,
        clearanceIn: effectiveSeparationInches,
        controlling,
      };
      notes.push(
        `Owner rule: ${effectiveSeparationInches}" below ${controlling.name} (${formatFeetInches(controlling.ft)} → attach at ${formatFeetInches(proposedAttachFt)})`,
      );
      calculatedCost += 200;
    } else if (isNewConstruction) {
      proposedAttachFt = poleData.aboveGround - clearances.minimumPoleTopSpace;
      ownerRecommendation = {
        basis: "new-construction",
        detail: `${Math.round(clearances.minimumPoleTopSpace * 12)}" below pole top`,
        clearanceIn: Math.round(clearances.minimumPoleTopSpace * 12),
        controlling: { name: "pole top", ft: poleData.aboveGround },
      };
      notes.push(
        `New construction: attach ${formatFeetInches(clearances.minimumPoleTopSpace)} below pole top`,
      );
      calculatedCost += 150;
    } else {
      // Fallback to voltage-based rule if nothing else triggered
      const pClear =
        existingPowerVoltage === "transmission"
          ? clearances.powerClearanceTransmission
          : clearances.powerClearanceDistribution;
      const powerFt = parseFeet(existingPowerHeight);
      proposedAttachFt = (powerFt != null ? powerFt : 0) - pClear;
      ownerRecommendation = {
        basis: "voltage-default",
        detail: `${Math.round((pClear || 0) * 12)}" below power conductor`,
        clearanceIn: Math.round((pClear || 0) * 12),
        controlling: { name: "power conductor", ft: powerFt || 0 },
      };
      notes.push(
        `Default rule: ${Math.round((pClear || 0) * 12)}" below power conductor`,
      );
      calculatedCost += 200;
    }

    // Apply minimum communications attachment height if provided in submissionProfile
    if (
      submissionProfile &&
      Number.isFinite(submissionProfile.minCommAttachFt) &&
      proposedAttachFt != null
    ) {
      const minAttach = Number(submissionProfile.minCommAttachFt);
      const allowedMax = powerPresent
        ? controlling.ft - effectiveSeparationFt
        : Infinity;
      const clamped = Math.min(
        Math.max(proposedAttachFt, minAttach),
        allowedMax,
      );
      if (clamped !== proposedAttachFt) {
        notes.push(
          `Applied min communications attach height constraint: ${formatFeetInches(minAttach)} (clamped to maintain required separation if needed)`,
        );
        proposedAttachFt = clamped;
      }
    }

    if (hasTransformer) {
      notes.push(
        "Transformer present: add clearance review and potential construction complexity",
      );
      calculatedCost += 300;
    }

    let sagFt = 0;
    let midspanFt = null;
    if (spanFt > 0 && adjacentPoleFt > 0 && proposedAttachFt != null) {
      sagFt = calculateSag(
        spanFt,
        cableData.weight,
        cableData.tension,
        wind,
        cableDiameter || cableData.diameter,
        Number(iceThicknessIn) || 0,
      );
      const adjacentPoleData = getPoleBurialData(adjacentPoleFt);
      // Estimate neighbor-end attach height
      let neighborAttachFt = null;
      if (
        adjacentProposedAttachFt != null &&
        Number.isFinite(Number(adjacentProposedAttachFt))
      )
        neighborAttachFt = Number(adjacentProposedAttachFt);
      if (neighborAttachFt == null) {
        const adjPowerFt = parseFeet(adjacentPowerHeight);
        if (adjPowerFt != null)
          neighborAttachFt = adjPowerFt - effectiveSeparationFt;
      }
      if (neighborAttachFt == null)
        neighborAttachFt = Math.max(
          0,
          adjacentPoleData.aboveGround - clearances.minimumPoleTopSpace,
        );
      midspanFt = (proposedAttachFt + neighborAttachFt) / 2 - sagFt;
      if (midspanFt < clearances.groundClearance) {
        localWarnings.push(
          `CRITICAL: midspan ${formatFeetInches(midspanFt)} < min ground clearance ${formatFeetInches(clearances.groundClearance)}`,
        );
      }
      if (spanFt > 300) {
        localWarnings.push(
          "Spans > 300 ft require special engineering and utility approval",
        );
        calculatedCost += 500;
      }
      if (
        spanFt > 150 &&
        String(attachmentType || "").includes("communication")
      )
        localWarnings.push(
          "Communication cable spans >150 ft may require intermediate support",
        );
    }

    // Drip loop specific clearance check (owner-based inches)
    if (proposedFt != null && dripFt != null) {
      const dripGapIn = (dripFt - proposedFt) * 12;
      const reqIn = effectiveSeparationInches; // align with pole separation to power-owned equipment
      if (dripGapIn < reqIn) {
        localWarnings.push(
          `Comm-to-Drip Loop at pole: ${dripGapIn.toFixed(1)}" (need ${reqIn}")`,
        );
        if (hasTransformer) {
          notes.push(
            "Owner last‑resort: tuck drip loop to ~1ft above bottom of transformer to regain clearance (utility approval required).",
          );
        }
      }
    }

    // Additional owner rules and guidance (FirstEnergy/Mon Power style)
    // These produce warnings or notes to guide field/design decisions; they don't hard-stop calculations.
    if (isFirstEnergyOwner) {
      // Minimum separations at pole to lowest power item; prefer stricter values if specified
      const sepToPowerIn = effectiveSeparationInches; // 40" typical, 44" FE floor
      if (proposedFt != null && controlling?.name) {
        const gapIn = (controlling.ft - proposedFt) * 12;
        if (gapIn < sepToPowerIn)
          localWarnings.push(
            `Comm-to-${controlling.name} at pole: ${gapIn.toFixed(1)}" (need ${sepToPowerIn}")`,
          );
      }
      // 30" below transformer bottom if that is lowest power control
      const transformerBottomFt = (existingLines || []).find((l) =>
        String(l?.type || "")
          .toLowerCase()
          .includes("transformer"),
      )?.height
        ? parseFeet(
            (existingLines || []).find((l) =>
              String(l?.type || "")
                .toLowerCase()
                .includes("transformer"),
            ).height,
          )
        : null;
      if (proposedFt != null && transformerBottomFt != null) {
        const gapIn = (transformerBottomFt - proposedFt) * 12;
        if (gapIn < 30)
          localWarnings.push(
            `Comm-to-Transformer bottom: ${gapIn.toFixed(1)}" (need 30")`,
          );
      }
      // 20" below street light (4" if bonded)
      const streetLightFt = parseFeet(inputs?.streetLightHeight);
      if (proposedFt != null && streetLightFt != null) {
        const bonded = false; // future: detect bonded flag
        const req = bonded ? 4 : 20;
        const gapIn = (streetLightFt - proposedFt) * 12;
        if (gapIn < req)
          localWarnings.push(
            `Comm-to-Street Light: ${gapIn.toFixed(1)}" (need ${req}")`,
          );
      }
      // 12" street light drip loop (12" if coated)
      const slDripFt = (existingLines || []).find((l) =>
        String(l?.type || "")
          .toLowerCase()
          .includes("street light drip"),
      )?.height
        ? parseFeet(
            (existingLines || []).find((l) =>
              String(l?.type || "")
                .toLowerCase()
                .includes("street light drip"),
            ).height,
          )
        : null;
      if (proposedFt != null && slDripFt != null) {
        const gapIn = (slDripFt - proposedFt) * 12;
        if (gapIn < 12)
          localWarnings.push(
            `Comm-to-Street Light Drip: ${gapIn.toFixed(1)}" (need 12")`,
          );
      }
      // 4" above street light (if crossing above)
      if (
        proposedFt != null &&
        streetLightFt != null &&
        proposedFt > streetLightFt
      ) {
        const gapIn = (proposedFt - streetLightFt) * 12;
        if (gapIn < 4)
          localWarnings.push(
            `Comm above Street Light: ${gapIn.toFixed(1)}" (need 4")`,
          );
      }
      // Midspan comm-to-comm: 12" mains/laterals; 4" drops
      if (midspanFt != null) {
        for (const line of existingLines || []) {
          const t = String(line?.type || "").toLowerCase();
          if (t.includes("communication")) {
            const otherFt = parseFeet(line?.height);
            if (otherFt != null) {
              const gapIn = Math.abs((midspanFt - otherFt) * 12);
              const isDrop = t.includes("drop");
              const req = isDrop ? 4 : 12;
              if (gapIn < req)
                localWarnings.push(
                  `Midspan comm-to-comm (${isDrop ? "drop" : "main"}): ${gapIn.toFixed(1)}" (need ${req}")`,
                );
            }
          }
        }
      }
      // Ground targets: Interstate, Railroads, Water, Driveways, Yards
      // (Targets are already applied via submissionProfile overrides; add contextual notes for clarity.)
      if (spanEnvironment === "railroad")
        notes.push("Railroad crossing: target 27 ft minimum ground clearance.");
      if (spanEnvironment === "wvHighway" || spanEnvironment === "road")
        notes.push(
          "State roads/highways: 18 ft minimum; Interstate 21 ft for new crossings.",
        );
    }

    let makeReadyTotal = 0;
    if (proposedFt != null) {
      existingLines.forEach((line) => {
        if (!line?.type) return;
        const lineNewFt =
          line.makeReady && line.makeReadyHeight
            ? parseFeet(line.makeReadyHeight)
            : parseFeet(line.height);
        if (lineNewFt == null) return;
        const lineInches = lineNewFt * 12;
        const proposedInches = proposedFt * 12;
        const isDrop = String(line.type).toLowerCase().includes("drop");
        const isNeutral = String(line.type).toLowerCase().includes("neutral");
        const isSecondary = String(line.type)
          .toLowerCase()
          .includes("secondary");
        let reqPoleIn = 12,
          reqMidIn = 9;
        if (isDrop) {
          reqPoleIn = 6;
          reqMidIn = 4;
        } else if (isNeutral || isSecondary) {
          // Owner-based clearance at pole: FE min 44", others min 40"; allow profile to increase via effective separation
          reqPoleIn = effectiveSeparationInches;
          reqMidIn = 15;
        }
        const poleGap = proposedInches - lineInches;
        if (poleGap < reqPoleIn)
          localWarnings.push(
            `Pole clearance to ${line.type}: ${poleGap.toFixed(1)}" (need ${reqPoleIn}")`,
          );
        if (midspanFt != null) {
          const midGap = midspanFt * 12 - lineInches;
          if (midGap < reqMidIn)
            localWarnings.push(
              `Midspan clearance to ${line.type}: ${midGap.toFixed(1)}" (need ${reqMidIn}")`,
            );
        }
        if (line.makeReady && line.makeReadyHeight && line.height) {
          const oldFt = parseFeet(line.height);
          const newFt = parseFeet(line.makeReadyHeight);
          if (oldFt != null && newFt != null) {
            const diffIn = (newFt - oldFt) * 12;
            makeReadyTotal += Math.abs(Math.round(diffIn)) * 12.5;
          }
        }
      });
    }

    let guy = null;
    if (spanFt > 0 && poleData.aboveGround > 0 && proposedAttachFt) {
      guy = calculateDownGuy(
        poleData.aboveGround,
        proposedAttachFt,
        cableData,
        spanFt,
        wind,
      );
      if (guy?.required) {
        notes.push("Down-guy likely required based on span and wind loading");
        calculatedCost += guy.totalCost || 0;
      }
    }

    const results = {
      pole: {
        inputHeight: Number(poleHeight) || 0,
        buriedFt: poleData.buried,
        aboveGroundFt: poleData.aboveGround,
        classInfo: poleData.classInfo,
        latitude: poleLatitude ?? null,
        longitude: poleLongitude ?? null,
      },
      attach: {
        proposedAttachFt,
        proposedAttachFmt: formatFeetInches(proposedAttachFt),
        recommendation: ownerRecommendation,
      },
      span: {
        spanFt,
        wind,
        sagFt,
        sagFmt: formatFeetInches(sagFt),
        midspanFt,
        midspanFmt: formatFeetInches(midspanFt),
      },
      clearances,
      makeReadyTotal,
      guy,
    };

    const cost = (calculatedCost || 0) + (results.makeReadyTotal || 0);
    return {
      ok: true,
      results,
      warnings: localWarnings,
      notes,
      cost,
      errors: {},
    };
  } catch (error) {
    logCalculationFailed({ subsystem: "computeAnalysis", code: "ERR_THROW" });
    return {
      ok: false,
      errors: {
        general:
          error instanceof Error ? error.message : "Unexpected analysis error",
      },
      warnings: [],
      notes: [],
      cost: null,
      results: null,
    };
  }
}
