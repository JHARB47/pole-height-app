import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Preflight: if persisted state is corrupt JSON, clear it to avoid runtime crash
try {
  const key = 'pole-height-store';
  const raw = localStorage.getItem(key);
  if (raw && typeof raw === 'string') {
    JSON.parse(raw);
  }
} catch {
  console.warn('Clearing corrupt persisted state');
  try { localStorage.removeItem('pole-height-store'); } catch {
    /* ignore */
  }
}

const useAppStore = create(persist((set) => ({
  // UI: per-section last saved timestamps
  uiSectionSaved: {}, // e.g., { map: ISO, spans: ISO, existing: ISO, field: ISO }
  setSectionSaved: (section) => set((s) => ({ uiSectionSaved: { ...(s.uiSectionSaved || {}), [section]: new Date().toISOString() } })),
  // Core pole data
  poleHeight: '',
  setPoleHeight: (height) => set({ poleHeight: height }),
  poleClass: '',
  setPoleClass: (poleClass) => set({ poleClass }),
  presetProfile: '',
  setPresetProfile: (presetProfile) => set({ presetProfile }),
  customMinTopSpace: '',
  setCustomMinTopSpace: (v) => set({ customMinTopSpace: v }),
  customRoadClearance: '',
  setCustomRoadClearance: (v) => set({ customRoadClearance: v }),
  customCommToPower: '',
  setCustomCommToPower: (v) => set({ customCommToPower: v }),
  // User preferences
  useTickMarkFormat: false, // true for 15' 6", false for 15ft 6in
  setUseTickMarkFormat: (value) => set({ useTickMarkFormat: value }),
  // Prefer auto-calculated span length (from endpoint coordinates) over manual/estimated
  preferAutoSpanLength: false,
  setPreferAutoSpanLength: (value) => set({ preferAutoSpanLength: value }),
  // Visual threshold for highlighting manual vs auto span length delta (ft)
  spanLenDeltaThresholdFt: 10,
  setSpanLenDeltaThresholdFt: (v) => set({ spanLenDeltaThresholdFt: Number(v) || 0 }),
  // UI preferences
  tableDensity: 'comfortable', // 'compact' | 'comfortable'
  setTableDensity: (v) => set({ tableDensity: v === 'compact' ? 'compact' : 'comfortable' }),
  spansColumnSegmentsVisible: true,
  setSpansColumnSegmentsVisible: (v) => set({ spansColumnSegmentsVisible: !!v }),
  spansColumnActionsVisible: true,
  setSpansColumnActionsVisible: (v) => set({ spansColumnActionsVisible: !!v }),
  // Project metadata for report
  projectName: '',
  setProjectName: (v) => set({ projectName: v }),
  applicantName: '',
  setApplicantName: (v) => set({ applicantName: v }),
  jobNumber: '',
  setJobNumber: (v) => set({ jobNumber: v }),
  // Default utility Owner context at job level (e.g., Mon Power, Penelec)
  jobOwner: '',
  setJobOwner: (v) => set({ jobOwner: v }),
  // GPS coordinates for the current pole/location
  poleLatitude: '',
  setPoleLatitude: (v) => set({ poleLatitude: v }),
  poleLongitude: '',
  setPoleLongitude: (v) => set({ poleLongitude: v }),
  // Branding/logo for report
  logoDataUrl: '',
  setLogoDataUrl: (v) => set({ logoDataUrl: v }),
  existingPowerHeight: '',
  setExistingPowerHeight: (height) => set({ existingPowerHeight: height }),
  existingPowerVoltage: 'distribution',
  setExistingPowerVoltage: (voltage) => set({ existingPowerVoltage: voltage }),
  spanDistance: '',
  setSpanDistance: (distance) => set({ spanDistance: distance }),
  spanEnvironment: 'road',
  setSpanEnvironment: (environment) => set({ spanEnvironment: environment }),
  isNewConstruction: true,
  setIsNewConstruction: (isNew) => set({ isNewConstruction: isNew }),
  attachmentType: 'communication',
  setAttachmentType: (type) => set({ attachmentType: type }),
  cableDiameter: '',
  setCableDiameter: (diameter) => set({ cableDiameter: diameter }),
  windSpeed: '90',
  setWindSpeed: (speed) => set({ windSpeed: speed }),
  iceThicknessIn: '0',
  setIceThicknessIn: (val) => set({ iceThicknessIn: val }),
  hasTransformer: false,
  setHasTransformer: (val) => set({ hasTransformer: val }),
  hasStreetlight: false,
  setHasStreetlight: (val) => set({ hasStreetlight: val }),
  requiresGuying: false,
  setRequiresGuying: (val) => set({ requiresGuying: val }),
  streetLightHeight: '',
  setStreetLightHeight: (height) => set({ streetLightHeight: height }),
  dripLoopHeight: '',
  setDripLoopHeight: (height) => set({ dripLoopHeight: height }),
  powerReference: 'auto',
  setPowerReference: (v) => set({ powerReference: v }),
  proposedLineHeight: '',
  setProposedLineHeight: (height) => set({ proposedLineHeight: height }),
  // Submission profiles (utility/region adjustable parameters and manifest targeting)
  submissionProfiles: [
    { name: 'firstEnergy', label: 'FirstEnergy / Mon Power', commToPowerIn: 44, minTopSpaceFt: 2.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'FE' },
    { name: 'aep', label: 'AEP (Generic)', commToPowerIn: 40, minTopSpaceFt: 2.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'AEP' },
  { name: 'duke', label: 'Duke Energy', commToPowerIn: 40, minTopSpaceFt: 1.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'DUKE' },
    { name: 'generic', label: 'Generic / NESC', commToPowerIn: 40, minTopSpaceFt: 1.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'GEN' },
  ],
  currentSubmissionProfile: 'firstEnergy',
  setCurrentSubmissionProfile: (name) => set({ currentSubmissionProfile: name }),
  updateSubmissionProfile: (name, patch) => set((s) => {
    const arr = (s.submissionProfiles || []).map(p => p.name === name ? { ...p, ...patch } : p);
    return { submissionProfiles: arr };
  }),
  adjacentPoleHeight: '',
  setAdjacentPoleHeight: (height) => set({ adjacentPoleHeight: height }),
  existingLines: [{ type: '', height: '', makeReady: false, makeReadyHeight: '', companyName: '' }],
  setExistingLines: (lines) => set({ existingLines: lines }),
  makeReadyNotes: '',
  setMakeReadyNotes: (notes) => set({ makeReadyNotes: notes }),
  results: null,
  setResults: (results) => set({ results }),
  warnings: [],
  setWarnings: (warnings) => set({ warnings }),
  engineeringNotes: [],
  setEngineeringNotes: (notes) => set({ engineeringNotes: notes }),
  guyAnalysis: null,
  setGuyAnalysis: (analysis) => set({ guyAnalysis: analysis }),
  costAnalysis: null,
  setCostAnalysis: (cost) => set({ costAnalysis: cost }),
  // Batch-set analysis output to minimize re-renders and state updates
  setAnalysis: (payload) => set(() => {
    const { results, warnings, notes, cost } = payload || {};
    return {
      results: results ?? null,
      warnings: warnings ?? [],
      engineeringNotes: notes ?? [],
      costAnalysis: cost ?? null,
    };
  }),
  // Scenario snapshots for A/B comparison
  scenarioA: null,
  setScenarioA: (scenario) => set({ scenarioA: scenario }),
  scenarioB: null,
  setScenarioB: (scenario) => set({ scenarioB: scenario }),
  // Batch import support
  mappingPreset: 'generic',
  setMappingPreset: (v) => set({ mappingPreset: v }),
  mappingProfiles: [], // { name, mapping }
  addMappingProfile: (name, mapping) => set((s) => {
    const filtered = (s.mappingProfiles || []).filter(p => p.name !== name);
    return { mappingProfiles: [...filtered, { name, mapping }] };
  }),
  setMappingProfiles: (profiles) => set((s) => {
    const map = new Map();
    for (const p of (s.mappingProfiles || [])) map.set(p.name, p);
    for (const p of (profiles || [])) if (p?.name && p?.mapping) map.set(p.name, p);
    return { mappingProfiles: Array.from(map.values()) };
  }),
  removeMappingProfile: (name) => set((s) => ({ mappingProfiles: (s.mappingProfiles || []).filter(p => p.name !== name) })),
  renameMappingProfile: (oldName, newName) => set((s) => {
    const arr = (s.mappingProfiles || []).map(p => p.name === oldName ? { ...p, name: newName } : p);
    return { mappingProfiles: arr };
  }),
  importedPoles: [],
  setImportedPoles: (arr) => set({ importedPoles: arr || [] }),
  // Jobs (projects) management
  // Job shape: {
  //   id, name, applicantName, jobNumber, presetProfile, jobOwner, notes, createdAt,
  //   commCompany,                    // Attaching communications company (for manifests/hints)
  //   submissionProfileName,         // One of submissionProfiles[].name
  //   submissionProfileOverrides,    // { commToPowerIn?, minTopSpaceFt?, roadClearanceFt?, manifestType? }
  //   exportProfile,                 // One of EXPORT_PRESETS values (e.g., 'arcgis','ikegps','katapultPro','firstEnergy')
  // }
  jobs: [],
  currentJobId: '',
  addJob: (job) => set((s) => {
    const id = job?.id || String(Date.now());
    const newJob = { 
      id, 
      name: job?.name || 'Untitled Job', 
      applicantName: job?.applicantName || '', 
      jobNumber: job?.jobNumber || '', 
      presetProfile: job?.presetProfile || '', 
      jobOwner: job?.jobOwner || '', 
      notes: job?.notes || '', 
      createdAt: job?.createdAt || new Date().toISOString(),
      commCompany: job?.commCompany || '',
      submissionProfileName: job?.submissionProfileName || s.currentSubmissionProfile || 'generic',
      submissionProfileOverrides: job?.submissionProfileOverrides || {},
  exportProfile: job?.exportProfile || 'generic',
    };
    const merged = [...(s.jobs || []), newJob];
    return { jobs: merged, currentJobId: id, projectName: newJob.name, applicantName: newJob.applicantName, jobNumber: newJob.jobNumber, presetProfile: newJob.presetProfile, jobOwner: newJob.jobOwner };
  }),
  updateJob: (id, patch) => set((s) => {
    const arr = (s.jobs || []).map(j => j.id === id ? { ...j, ...patch } : j);
    const current = arr.find(j => j.id === s.currentJobId);
    const updates = current ? { projectName: current.name, applicantName: current.applicantName, jobNumber: current.jobNumber, presetProfile: current.presetProfile, jobOwner: current.jobOwner || '' } : {};
    return { jobs: arr, ...updates };
  }),
  removeJob: (id) => set((s) => {
    const arr = (s.jobs || []).filter(j => j.id !== id);
    let currentJobId = s.currentJobId;
    if (currentJobId === id) {
      currentJobId = arr[0]?.id || '';
    }
    const current = arr.find(j => j.id === currentJobId);
    const updates = current ? { projectName: current.name, applicantName: current.applicantName, jobNumber: current.jobNumber, presetProfile: current.presetProfile, jobOwner: current.jobOwner || '' } : {};
    return { jobs: arr, currentJobId, ...updates };
  }),
  setCurrentJobId: (id) => set((s) => {
    const found = (s.jobs || []).find(j => j.id === id);
    if (!found) return { currentJobId: id };
    return { currentJobId: id, projectName: found.name, applicantName: found.applicantName, jobNumber: found.jobNumber, presetProfile: found.presetProfile, jobOwner: found.jobOwner || '' };
  }),
  // Field-collected poles (manual collection in the field)
  collectedPoles: [],
  setCollectedPoles: (arr) => set({ collectedPoles: arr || [] }),
  addCollectedPole: (pole) => set((s) => {
    const jobId = pole?.jobId || s.currentJobId || '';
    return { collectedPoles: [...(s.collectedPoles || []), { 
      // planned vs as-built fields
      asBuilt: {
        attachHeight: pole?.asBuilt?.attachHeight || '',
        powerHeight: pole?.asBuilt?.powerHeight || '',
      },
      ...pole, jobId }] };
  }),
  updateCollectedPole: (index, patch) => set((s) => {
    const arr = (s.collectedPoles || []).slice();
    if (index >= 0 && index < arr.length) arr[index] = { ...arr[index], ...patch };
    return { collectedPoles: arr };
  }),
  removeCollectedPole: (index) => set((s) => {
    const arr = (s.collectedPoles || []).slice();
    if (index >= 0 && index < arr.length) arr.splice(index, 1);
    return { collectedPoles: arr };
  }),
  importedSpans: [],
  setImportedSpans: (arr) => set({ importedSpans: arr || [] }),
  updateImportedSpan: (index, patch) => set((s) => {
    const arr = (s.importedSpans || []).slice();
    if (index >= 0 && index < arr.length) arr[index] = { ...arr[index], ...patch };
    return { importedSpans: arr };
  }),
  // Cached midspan results (quick-save while working)
  cachedMidspans: [],
  addCachedMidspan: (item) => set((s) => ({ cachedMidspans: [...(s.cachedMidspans||[]), { id: String(Date.now()), ...item }] })),
  updateCachedMidspan: (id, patch) => set((s) => ({ cachedMidspans: (s.cachedMidspans||[]).map(m => m.id===id ? { ...m, ...patch } : m) })),
  removeCachedMidspan: (id) => set((s) => ({ cachedMidspans: (s.cachedMidspans||[]).filter(m => m.id !== id) })),
  clearCachedMidspans: () => set({ cachedMidspans: [] }),
  importedExistingLines: [],
  setImportedExistingLines: (arr) => set({ importedExistingLines: arr || [] }),
  existingLinesCSV: '',
  setExistingLinesCSV: (v) => set({ existingLinesCSV: v }),
  csvLineMapping: { type: 'type', company: 'company', height: 'height', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' },
  setCsvLineMapping: (m) => set({ csvLineMapping: m }),
  // PDF overlay layout presets per job and environment
  // Shape: pdfLayouts[jobId||'_global'][env][name] = layoutArray
  pdfLayouts: {},
  savePdfLayout: (env, name, layout) => set((s) => {
    const jobId = s.currentJobId || '_global';
    const layouts = { ...(s.pdfLayouts || {}) };
    const byJob = { ...(layouts[jobId] || {}) };
    const byEnv = { ...(byJob[env] || {}) };
    byEnv[name || 'Default'] = Array.isArray(layout) ? layout : [];
    byJob[env] = byEnv;
    layouts[jobId] = byJob;
    return { pdfLayouts: layouts };
  }),
  removePdfLayout: (env, name) => set((s) => {
    const jobId = s.currentJobId || '_global';
    const layouts = { ...(s.pdfLayouts || {}) };
    const byJob = { ...(layouts[jobId] || {}) };
    const byEnv = { ...(byJob[env] || {}) };
    if (name in byEnv) delete byEnv[name];
    byJob[env] = byEnv;
    layouts[jobId] = byJob;
    return { pdfLayouts: layouts };
  }),
  // Reset all state
  reset: () => set({
  uiSectionSaved: {},
    poleHeight: '',
    poleClass: '',
    presetProfile: '',
  customMinTopSpace: '',
  customRoadClearance: '',
  customCommToPower: '',
  useTickMarkFormat: false,
  preferAutoSpanLength: false,
  spanLenDeltaThresholdFt: 10,
  tableDensity: 'comfortable',
  spansColumnSegmentsVisible: true,
  spansColumnActionsVisible: true,
  projectName: '',
  applicantName: '',
  jobNumber: '',
  jobOwner: '',
  logoDataUrl: '',
  poleLatitude: '',
  poleLongitude: '',
    existingPowerHeight: '',
    existingPowerVoltage: 'distribution',
    spanDistance: '',
    spanEnvironment: 'road',
    isNewConstruction: true,
    attachmentType: 'communication',
    cableDiameter: '',
    windSpeed: '90',
  iceThicknessIn: '0',
    hasTransformer: false,
    hasStreetlight: false,
    requiresGuying: false,
    streetLightHeight: '',
    dripLoopHeight: '',
  powerReference: 'auto',
    proposedLineHeight: '',
    submissionProfiles: [
    { name: 'firstEnergy', label: 'FirstEnergy / Mon Power', commToPowerIn: 44, minTopSpaceFt: 2.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'FE' },
    { name: 'aep', label: 'AEP (Generic)', commToPowerIn: 40, minTopSpaceFt: 2.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'AEP' },
  { name: 'duke', label: 'Duke Energy', commToPowerIn: 40, minTopSpaceFt: 1.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'DUKE' },
    { name: 'generic', label: 'Generic / NESC', commToPowerIn: 40, minTopSpaceFt: 1.0, roadClearanceFt: 18.0,
      envRoadFt: 18.0, envResidentialFt: 15.5, envPedestrianFt: 15.5, envFieldFt: 15.5,
      envResidentialYardFt: 9.5, envResidentialDrivewayFt: 15.5, envNonResidentialDrivewayFt: 16.0,
      envWaterwayFt: 14.0, envWVHighwayFt: 18.0, envPAHighwayFt: 18.0, envOHHighwayFt: 18.0, envMDHighwayFt: 18.0,
      envInterstateFt: 18.0, envInterstateNewCrossingFt: 21.0,
      envRailroadFt: 27.0, minCommAttachFt: 14.0, manifestType: 'GEN' },
    ],
    currentSubmissionProfile: 'firstEnergy',
    adjacentPoleHeight: '',
    existingLines: [{ type: '', height: '', makeReady: false, makeReadyHeight: '', companyName: '' }],
    makeReadyNotes: '',
    results: null,
    warnings: [],
    engineeringNotes: [],
    guyAnalysis: null,
    costAnalysis: null,
    scenarioA: null,
    scenarioB: null,
  mappingPreset: 'generic',
  mappingProfiles: [],
  importedPoles: [],
  collectedPoles: [],
  importedSpans: [],
  cachedMidspans: [],
  importedExistingLines: [],
  existingLinesCSV: '',
  csvLineMapping: { type: 'type', company: 'company', height: 'height', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' },
  pdfLayouts: {},
  })
}), { name: 'pole-height-store', storage: createJSONStorage(() => localStorage) }));

export default useAppStore;
