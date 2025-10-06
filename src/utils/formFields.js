// Build normalized key-value maps for official form field population.
// These do not embed official templates; instead, they provide a consistent
// set of fields that can be transcribed into agency forms.

function baseFields(summary) {
  const s = summary || {};
  return {
    type: s.type || "",
    applicant: s.job?.applicant || "",
    jobName: s.job?.name || "",
    jobNumber: s.job?.jobNumber || "",
    owner: s.job?.owner || "",
    commCompany: s.job?.commCompany || "",
    submissionProfileName: s.job?.submissionProfileName || "",
    manifestType: s.profile?.manifestType || "",
    environment: s.environment || "",
    poleHeightFt: s.pole?.heightFt ?? "",
    poleClass: s.pole?.class || "",
    poleLatitude: s.pole?.gps?.lat || "",
    poleLongitude: s.pole?.gps?.lon || "",
    // Geospatial from controlling midspan
    midLatitude: s.span?.midLatitude || "",
    midLongitude: s.span?.midLongitude || "",
    fromPoleId: s.span?.endpoints?.from?.id || "",
    toPoleId: s.span?.endpoints?.to?.id || "",
    fromLatitude: s.span?.endpoints?.from?.latitude || "",
    fromLongitude: s.span?.endpoints?.from?.longitude || "",
    toLatitude: s.span?.endpoints?.to?.latitude || "",
    toLongitude: s.span?.endpoints?.to?.longitude || "",
    powerVoltage: s.power?.voltage || "",
    powerHeight: s.power?.heightFt || "",
    spanLengthFt: s.span?.lengthFt ?? "",
    midspanFt: s.span?.midspanFt ?? "",
    targetGroundClearanceFt: s.span?.targetFt ?? "",
    computedGroundClearanceFt: s.span?.computedGroundClearanceFt ?? "",
    targetSource: s.span?.targetSource || "",
    attachProposedFt: s.attach?.proposedFt ?? "",
    attachBasis: s.attach?.basis || "",
    attachDetail: s.attach?.detail || "",
    generatedAt: s.timestamps?.generatedAt || new Date().toISOString(),
  };
}

export function buildMM109Fields(summary) {
  const f = baseFields(summary);
  // WVDOH-specific aliases (keys named after common MM-109 concepts)
  return {
    ...f,
    // Aliases for convenience (can be extended later as needed)
    applicantCompany: f.applicant,
    roadwayType: f.environment,
    latitude: f.poleLatitude,
    longitude: f.poleLongitude,
  };
}

export function buildCSXFields(summary) {
  const f = baseFields(summary);
  // CSX-specific aliases
  return {
    ...f,
    applicantCompany: f.applicant,
    crossingType: f.environment,
    latitude: f.poleLatitude,
    longitude: f.poleLongitude,
  };
}

export function buildStateHighwayFields(summary, agencyLabel) {
  const f = baseFields(summary);
  return {
    ...f,
    agency: agencyLabel || "State DOT",
    roadwayType: f.environment,
    latitude: f.poleLatitude,
    longitude: f.poleLongitude,
  };
}

export default { buildMM109Fields, buildCSXFields, buildStateHighwayFields };
