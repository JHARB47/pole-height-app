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
  // Project metadata for report
  projectName: '',
  setProjectName: (v) => set({ projectName: v }),
  applicantName: '',
  setApplicantName: (v) => set({ applicantName: v }),
  jobNumber: '',
  setJobNumber: (v) => set({ jobNumber: v }),
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
  proposedLineHeight: '',
  setProposedLineHeight: (height) => set({ proposedLineHeight: height }),
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
  importedSpans: [],
  setImportedSpans: (arr) => set({ importedSpans: arr || [] }),
  importedExistingLines: [],
  setImportedExistingLines: (arr) => set({ importedExistingLines: arr || [] }),
  existingLinesCSV: '',
  setExistingLinesCSV: (v) => set({ existingLinesCSV: v }),
  csvLineMapping: { type: 'type', company: 'company', height: 'height', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' },
  setCsvLineMapping: (m) => set({ csvLineMapping: m }),
  // Reset all state
  reset: () => set({
    poleHeight: '',
    poleClass: '',
    presetProfile: '',
  customMinTopSpace: '',
  customRoadClearance: '',
  customCommToPower: '',
  useTickMarkFormat: false,
  projectName: '',
  applicantName: '',
  jobNumber: '',
  logoDataUrl: '',
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
    proposedLineHeight: '',
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
  importedSpans: [],
  importedExistingLines: [],
  existingLinesCSV: '',
  csvLineMapping: { type: 'type', company: 'company', height: 'height', makeReady: 'makeReady', makeReadyHeight: 'makeReadyHeight' },
  })
}), { name: 'pole-height-store', storage: createJSONStorage(() => localStorage) }));

export default useAppStore;
