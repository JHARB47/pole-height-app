// Unified calculations utility (ES module) with ft/in parsing & formatting

// ---------- formatting helpers ----------
export function parseFeet(value) {
  if (value == null) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const s = String(value).trim().toLowerCase();
  if (s === '') return null;

  // inches only patterns: 10", 10'', 10in
  const inchesOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:""|"|in)$/i);
  if (inchesOnly) return (parseFloat(inchesOnly[1]) || 0) / 12;

  // feet only patterns: 15', 15ft
  const feetOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)$/i);
  if (feetOnly) return parseFloat(feetOnly[1]) || 0;

  // feet and inches patterns: 35'6", 35' 6", 35ft 6in, 35 ft 6 in
  const ftInMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)\s*(\d+(?:\.\d+)?)\s*(?:""|"|in)?$/i);
  if (ftInMatch) {
    const ft = parseFloat(ftInMatch[1]) || 0;
    const inch = parseFloat(ftInMatch[2] ?? '0') || 0;
    return ft + inch / 12;
  }

  // fallback to plain number (assume feet)
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function formatFeetInches(feet, { compact = false, tickMarks = false } = {}) {
  if (feet == null || Number.isNaN(feet)) return '--';
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  const sign = isNeg ? '-' : '';
  
  if (tickMarks) {
    return compact ? `${sign}${ft}' ${inch}"` : `${sign}${ft}' ${inch}"`;
  } else {
    return compact ? `${sign}${ft}' ${inch}"` : `${sign}${ft}ft ${inch}in`;
  }
}

// Additional formatting function specifically for tick marks
export function formatFeetInchesTickMarks(feet) {
  if (feet == null || Number.isNaN(feet)) return '--';
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  const sign = isNeg ? '-' : '';
  return `${sign}${ft}' ${inch}"`;
}

// Additional formatting function specifically for verbose format
export function formatFeetInchesVerbose(feet) {
  if (feet == null || Number.isNaN(feet)) return '--';
  const isNeg = feet < 0;
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inch = Math.round((abs - ft) * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  const sign = isNeg ? '-' : '';
  return `${sign}${ft}ft ${inch}in`;
}

// ---------- defaults ----------
export const DEFAULTS = {
  cableTypes: [
    { label: 'ADSS (0.5")', value: 'adss', weight: 0.08, tension: 1200, diameter: 0.5 },
    { label: 'Coax (0.75")', value: 'coax', weight: 0.12, tension: 1500, diameter: 0.75 },
    { label: 'Copper (0.5")', value: 'copper', weight: 0.10, tension: 1400, diameter: 0.5 },
    { label: 'Triplex (1.0")', value: 'triplex', weight: 0.20, tension: 1800, diameter: 1.0 },
    { label: 'Generic Comm (0.6")', value: 'communication', weight: 0.10, tension: 1400, diameter: 0.6 },
  ],
  presets: {
    firstEnergy: { label: 'FirstEnergy', value: 'firstEnergy', voltage: 'distribution', minTopSpace: 2.0, roadClearance: 18.0, commToPower: 40/12 },
    pse: { label: 'PSE', value: 'pse', voltage: 'distribution', minTopSpace: 2.0, roadClearance: 18.0, commToPower: 42/12 },
  duke: { label: 'Duke', value: 'duke', voltage: 'distribution', minTopSpace: 2.0, roadClearance: 18.0, commToPower: 40/12 },
  nationalGrid: { label: 'National Grid', value: 'nationalGrid', voltage: 'distribution', minTopSpace: 2.0, roadClearance: 18.0, commToPower: 40/12 },
  }
};

// ---------- core calcs ----------
export function getNESCClearances(voltage = 'communication', environment = 'road') {
  const clearances = {
    communication: {
      groundClearance: environment === 'road' ? 15.5 : 9.5,
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
      groundClearance: environment === 'road' ? 23.0 : 18.0,
      roadClearance: 25.0,
      powerClearanceDistribution: 0,
      powerClearanceTransmission: 4.0,
      minimumPoleTopSpace: 2.0,
    },
    transmission: {
      groundClearance: environment === 'road' ? 28.5 : 23.0,
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
  if (typeof preset.minTopSpace === 'number') updated.minimumPoleTopSpace = preset.minTopSpace;
  if (typeof preset.roadClearance === 'number') updated.roadClearance = preset.roadClearance;
  if (typeof preset.commToPower === 'number') updated.powerClearanceDistribution = preset.commToPower;
  return updated;
}

export function applyPresetObject(clearances, presetObj) {
  if (!presetObj) return clearances;
  const updated = { ...clearances };
  if (typeof presetObj.minTopSpace === 'number') updated.minimumPoleTopSpace = presetObj.minTopSpace;
  if (typeof presetObj.roadClearance === 'number') updated.roadClearance = presetObj.roadClearance;
  if (typeof presetObj.commToPower === 'number') updated.powerClearanceDistribution = presetObj.commToPower;
  return updated;
}

export function resultsToCSV(results, warnings = [], makeReadyNotes = '', { useTickMarks = false } = {}) {
  if (!results) return '';
  const lines = [];
  const fmt = useTickMarks ? formatFeetInchesTickMarks : formatFeetInches;
  
  lines.push('Section,Field,Value');
  lines.push(`Pole,Height,${fmt(results.pole.inputHeight)}`);
  lines.push(`Pole,Buried,${fmt(results.pole.buriedFt)}`);
  lines.push(`Pole,Above Ground,${fmt(results.pole.aboveGroundFt)}`);
  lines.push(`Attach,Proposed,${useTickMarks ? formatFeetInchesTickMarks(results.attach.proposedAttachFt) : results.attach.proposedAttachFmt}`);
  lines.push(`Span,Length,${results.span.spanFt} ft`);
  lines.push(`Span,Wind,${results.span.wind} mph`);
  lines.push(`Span,Sag,${useTickMarks ? formatFeetInchesTickMarks(results.span.sagFt) : results.span.sagFmt}`);
  lines.push(`Span,Midspan,${useTickMarks ? formatFeetInchesTickMarks(results.span.midspanFt) : results.span.midspanFmt}`);
  lines.push(`Clearances,Ground Target,${fmt(results.clearances.groundClearance)}`);
  lines.push(`Clearances,Road Target,${fmt(results.clearances.roadClearance)}`);
  if (results.makeReadyTotal != null) lines.push(`Make-ready,Total,$${results.makeReadyTotal}`);
  if (results.guy) {
    lines.push(`Guying,Required,${results.guy.required ? 'Yes' : 'No'}`);
    lines.push(`Guying,Tension,${Math.round(results.guy.tension || 0)} lb`);
    lines.push(`Guying,Angle,${Math.round(results.guy.angle || 0)} deg`);
  }
  if (warnings?.length) lines.push(`Warnings,Count,${warnings.length}`);
  if (makeReadyNotes) lines.push(`Notes,Make-ready,"${makeReadyNotes.replace(/"/g,'""')}"`);
  return lines.join('\n');
}

export function getPoleBurialData(height, poleClass = '') {
  const h = Number(height) || 0;
  const buried = Math.max(5, h * 0.1 + 2);
  const aboveGround = Math.max(0, h - buried);
  const recommendedClass = h <= 30 ? 'Class 6 typical'
    : h <= 35 ? 'Class 4-5 typical'
    : h <= 40 ? 'Class 3-4 typical'
    : h <= 45 ? 'Class 2-3 typical'
    : 'Class 1-2 typical';
  const classInfo = poleClass || recommendedClass;
  return { buried, aboveGround, classInfo, recommendedClass };
}

export function calculateSag(
  spanFt,
  weightLbsPerFt,
  tensionLbs,
  windSpeedMph = 90,
  cableDiameterIn = 0.5,
  iceThicknessIn = 0
) {
  const L = Number(spanFt) || 0;
  const T = Math.max(1, Number(tensionLbs) || 1200);
  const dFt = Math.max(0, (Number(cableDiameterIn) || 0.5) + 2 * (Number(iceThicknessIn) || 0)) / 12;
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
  pullDirectionDeg = 0
) {
  if (!cableData || !spanLengthFt || !attachmentHeightFt) return null;
  const leverArm = Number(attachmentHeightFt) || 0;
  const span = Number(spanLengthFt) || 0;
  const wind = Number(windSpeedMph) || 0;
  const T = cableData.tension || 1500;
  const windPressure = 0.00256 * Math.pow(wind, 2) * ((cableData.diameter || 0.6) / 12);
  const windLoadOnSpan = windPressure * span;
  const horizontalLoad = T * 0.1 + windLoadOnSpan; // approx unbalanced + wind
  const guyAttach = Math.max(1, Number(poleAboveGroundFt) || 1) * 0.85;
  const leadDistance = guyAttach * 0.5; // typical lead
  const guyTension = (horizontalLoad * leverArm) / Math.max(1, guyAttach);
  const guyAngle = Math.atan(guyAttach / Math.max(0.1, leadDistance)) * (180 / Math.PI);
  const required = guyTension > 500;
  const totalCost = required ? 350 + Math.min(650, Math.round(guyTension / 10)) : 0;
  return { required, tension: guyTension, angle: guyAngle, leadDistance, guyHeight: guyAttach, pullDirection: pullDirectionDeg, totalCost };
}

export function analyzeMakeReadyImpact(existingFt, proposedFt, minSeparationFt) {
  const existing = Number(existingFt);
  const proposed = Number(proposedFt);
  const minSep = Number(minSeparationFt);
  if (!Number.isFinite(existing) || !Number.isFinite(proposed) || !Number.isFinite(minSep)) return null;
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
      'Pole Attachment Agreement executed',
      'SPANS electronic submission required (max 25 poles per application)',
      'Pole profile for each pole attachment point',
      'Site map with route connectivity shown',
      'High resolution photos taken within 30 days',
      'GPS coordinates required if no visible pole tag',
      'Load analysis required for spans exceeding 250 feet',
      'Engineering drawings for complex attachments'
    ],
    prohibitedItems: [
      'Boxing and extension arms not permitted',
      'Additional equipment mounting on pole',
      'Steel transmission structure attachments',
      'Overlashing prohibited in New Jersey territory',
      'Grounding to pole without utility approval',
      'Modifications to existing pole hardware'
    ],
    engineeringChecks: [
      'NESC Table 232-1 compliance verification',
      'Pole loading analysis if span > 250ft or guy required',
      'Make-ready construction cost assessment',
      'Ground clearance verification at midspan',
      'Post-construction inspection scheduling',
      'Storm restoration priority classification'
    ],
    makeReadyProcess: [
      'Utility performs make-ready work',
      'Attacher pays for make-ready costs',
      'Standard make-ready: $150-300 per attachment point',
      'Complex make-ready: $500-1500 per pole',
      'Timeline: 45-90 days after approval'
    ]
  };
}

// ---------- pure analysis for reuse (UI and batch) ----------
export function computeAnalysis(inputs) {
  const {
    poleHeight,
    poleClass,
    existingPowerHeight,
    existingPowerVoltage = 'distribution',
    spanDistance,
    isNewConstruction,
    adjacentPoleHeight,
    attachmentType,
    cableDiameter,
    windSpeed,
    spanEnvironment = 'road',
    streetLightHeight,
    dripLoopHeight,
    proposedLineHeight,
    existingLines = [],
    iceThicknessIn,
    hasTransformer,
    presetProfile,
    customMinTopSpace,
    customRoadClearance,
    customCommToPower,
  } = inputs || {};

  const errs = {};
  if (!poleHeight) errs.poleHeight = 'Pole height required for analysis';
  if (!isNewConstruction && !existingPowerHeight) errs.existingPowerHeight = 'Power wire height required for existing pole analysis';
  if (Object.keys(errs).length) return { errors: errs };

  const poleData = getPoleBurialData(Number(poleHeight) || 0, poleClass);
  const cableData = DEFAULTS.cableTypes.find(c => c.value === attachmentType) || DEFAULTS.cableTypes[0];
  const spanFt = Number(spanDistance) || 0;
  const wind = Number(windSpeed) || 90;
  const adjacentPoleFt = Number(adjacentPoleHeight) || 0;
  const proposedFt = parseFeet(proposedLineHeight);
  const streetFt = parseFeet(streetLightHeight);
  const dripFt = parseFeet(dripLoopHeight);

  let clearances = getNESCClearances(existingPowerVoltage, spanEnvironment);
  clearances = applyPresetToClearances(clearances, presetProfile);
  if (customMinTopSpace) clearances.minimumPoleTopSpace = Number(customMinTopSpace) || clearances.minimumPoleTopSpace;
  if (customRoadClearance) clearances.roadClearance = Number(customRoadClearance) || clearances.roadClearance;
  if (customCommToPower) clearances.powerClearanceDistribution = Number(customCommToPower) || clearances.powerClearanceDistribution;

  let localWarnings = [];
  let notes = [];
  let calculatedCost = 0;

  let proposedAttachFt = null;
  if (isNewConstruction) {
    proposedAttachFt = poleData.aboveGround - clearances.minimumPoleTopSpace;
    notes.push(`New construction: attach ${formatFeetInches(clearances.minimumPoleTopSpace)} below pole top`);
    calculatedCost += 150;
  } else {
    const pClear = existingPowerVoltage === 'transmission'
      ? clearances.powerClearanceTransmission
      : clearances.powerClearanceDistribution;
    const powerFt = parseFeet(existingPowerHeight);
    proposedAttachFt = (powerFt != null ? powerFt : 0) - pClear;
    notes.push(`Existing power clearance: ${Math.round(pClear * 12)}" (${pClear.toFixed(2)} ft)`);
    calculatedCost += 200;
  }

  if (hasTransformer) {
    notes.push('Transformer present: add clearance review and potential construction complexity');
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
      Number(iceThicknessIn) || 0
    );
    const adjacentPoleData = getPoleBurialData(adjacentPoleFt);
    midspanFt = ((proposedAttachFt + (adjacentPoleData.aboveGround - 1)) / 2) - sagFt;
    if (midspanFt < clearances.groundClearance) {
      localWarnings.push(`CRITICAL: midspan ${formatFeetInches(midspanFt)} < min ground clearance ${formatFeetInches(clearances.groundClearance)}`);
    }
    if (spanFt > 300) { localWarnings.push('Spans > 300 ft require special engineering and utility approval'); calculatedCost += 500; }
    if (spanFt > 150 && String(attachmentType || '').includes('communication')) localWarnings.push('Communication cable spans >150 ft may require intermediate support');
  }

  const controllingLightInches = Math.max((streetFt || 0) * 12, (dripFt || 0) * 12, 15 * 12);
  if (proposedFt != null) {
    const proposedInches = proposedFt * 12;
    if (proposedInches > controllingLightInches - 20) localWarnings.push('Proposed line must maintain 20" clearance below street light/drip loop');
  }

  let makeReadyTotal = 0;
  if (proposedFt != null) {
    existingLines.forEach(line => {
      if (!line?.type) return;
      const lineNewFt = (line.makeReady && line.makeReadyHeight) ? parseFeet(line.makeReadyHeight) : parseFeet(line.height);
      if (lineNewFt == null) return;
      const lineInches = lineNewFt * 12;
      const proposedInches = proposedFt * 12;
      const isDrop = String(line.type).toLowerCase().includes('drop');
      const isNeutral = String(line.type).toLowerCase().includes('neutral');
      let reqPoleIn = 12, reqMidIn = 9;
      if (isDrop) { reqPoleIn = 6; reqMidIn = 4; }
      else if (isNeutral) { reqPoleIn = 20; reqMidIn = 15; }
      const poleGap = proposedInches - lineInches;
      if (poleGap < reqPoleIn) localWarnings.push(`Pole clearance to ${line.type}: ${poleGap.toFixed(1)}" (need ${reqPoleIn}")`);
      if (midspanFt != null) {
        const midGap = (midspanFt * 12) - lineInches;
        if (midGap < reqMidIn) localWarnings.push(`Midspan clearance to ${line.type}: ${midGap.toFixed(1)}" (need ${reqMidIn}")`);
      }
      if (line.makeReady && line.makeReadyHeight && line.height) {
        const diffIn = (parseFeet(line.makeReadyHeight) - parseFeet(line.height)) * 12;
        makeReadyTotal += Math.abs(Math.round(diffIn)) * 12.5;
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
      wind
    );
    if (guy?.required) {
      notes.push('Down-guy likely required based on span and wind loading');
      calculatedCost += guy.totalCost || 0;
    }
  }

  const results = {
    pole: {
      inputHeight: Number(poleHeight) || 0,
      buriedFt: poleData.buried,
      aboveGroundFt: poleData.aboveGround,
      classInfo: poleData.classInfo,
    },
    attach: {
      proposedAttachFt,
      proposedAttachFmt: formatFeetInches(proposedAttachFt),
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
  return { results, warnings: localWarnings, notes, cost };
}

