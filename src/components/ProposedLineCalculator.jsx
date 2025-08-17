import React, { useEffect } from 'react';
import useAppStore from '../utils/store';
import { DEFAULTS, parseFeet, formatFeetInches, formatFeetInchesTickMarks, formatFeetInchesVerbose, resultsToCSV, computeAnalysis } from '../utils/calculations';
import ExistingLinesEditor from './ExistingLinesEditor';
import { WV_COMPANIES } from '../utils/constants';
import SpanDiagram from './SpanDiagram';
import { importGeospatialFile, mapGeoJSONToAppData, MAPPING_PRESETS, parseExistingLinesCSV, getAttributeKeys, splitFeaturesByGeometry } from '../utils/importers';
import { buildManifest, csvFrom } from '../utils/manifests';
import { makePermitSummary } from '../utils/permitSummary';
// Geodata utilities are imported dynamically in onPermit to keep geospatial libs lazy-loaded
import SpansEditor from './SpansEditor';

export default function ProposedLineCalculator() {
  const {
    poleHeight,
    poleClass,
    setPoleHeight,
    setPoleClass,
  jobs,
  currentJobId,
  setCurrentJobId,
    existingPowerHeight,
    existingPowerVoltage,
    setExistingPowerHeight,
    setExistingPowerVoltage,
    spanDistance,
    isNewConstruction,
    setIsNewConstruction,
    adjacentPoleHeight,
    attachmentType,
    cableDiameter,
    windSpeed,
    spanEnvironment,
    streetLightHeight,
    dripLoopHeight,
    proposedLineHeight,
    existingLines,
    iceThicknessIn,
    hasTransformer,
    setHasTransformer,
  powerReference,
  setPowerReference,
  // setHasStreetlight,
    setDripLoopHeight,
    setStreetLightHeight,
    setResults,
    setWarnings,
    setEngineeringNotes,
    setMakeReadyNotes,
    setCostAnalysis,
    setSpanDistance,
    setAdjacentPoleHeight,
    setAttachmentType,
    setCableDiameter,
    setWindSpeed,
    setIceThicknessIn,
    setSpanEnvironment,
    setProposedLineHeight,
    presetProfile,
    setPresetProfile,
  // scenarioA,
  // setScenarioA,
  // scenarioB,
  // setScenarioB,
    customMinTopSpace,
    setCustomMinTopSpace,
    customRoadClearance,
    setCustomRoadClearance,
    customCommToPower,
    setCustomCommToPower,
    useTickMarkFormat,
    setUseTickMarkFormat,
    projectName,
    setProjectName,
    applicantName,
    setApplicantName,
    jobNumber,
    setJobNumber,
    jobOwner,
    setJobOwner,
  submissionProfiles,
  currentSubmissionProfile,
  setCurrentSubmissionProfile,
  poleLatitude,
  setPoleLatitude,
  poleLongitude,
  setPoleLongitude,
  } = useAppStore();
  const [showReport, setShowReport] = React.useState(false);
  const [showBatchReport, setShowBatchReport] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [helpSection, setHelpSection] = React.useState(null);

  // Make-ready notes & estimate
  useEffect(() => {
    const notes = existingLines
      .filter(line => line.makeReady && line.makeReadyHeight && line.height)
      .map(line => {
        const fmt = (val) => formatFeetInches(parseFeet(val));
        const heightDiffInches = (parseFeet(line.makeReadyHeight) - parseFeet(line.height)) * 12;
        const cost = Math.abs(Math.round(heightDiffInches)) * 12.5;
        return `LWR (${line.companyName || line.type}) FROM ${fmt(line.height)} TO ${fmt(line.makeReadyHeight)} - Est. Cost: $${cost}`;
      })
    setMakeReadyNotes(notes.join('\n'));
  }, [existingLines, setMakeReadyNotes]);

  // Main calculation effect (now driven by pure computeAnalysis)
  useEffect(() => {
    // Prefer job-level submission profile/overrides if available
    const activeJob = (useAppStore.getState().jobs||[]).find(j=>j.id===useAppStore.getState().currentJobId);
    const profileName = activeJob?.submissionProfileName || currentSubmissionProfile;
    const baseProfile = (submissionProfiles||[]).find(p=>p.name===profileName);
    const mergedProfile = baseProfile ? { 
      ...baseProfile, 
      ...(activeJob?.submissionProfileOverrides || {}) 
    } : undefined;
    const { results, warnings, notes, cost, errors } = computeAnalysis({
      poleHeight, poleClass, poleLatitude, poleLongitude, existingPowerHeight, existingPowerVoltage,
      spanDistance, isNewConstruction, adjacentPoleHeight,
      attachmentType, cableDiameter, windSpeed, spanEnvironment,
  streetLightHeight, dripLoopHeight, proposedLineHeight,
  existingLines, iceThicknessIn, hasTransformer, presetProfile,
  customMinTopSpace, customRoadClearance, customCommToPower,
  powerReference, jobOwner,
      submissionProfile: mergedProfile,
    });
    if (errors) {
      setResults(null); setWarnings([]); setEngineeringNotes([]); setCostAnalysis(null);
      return;
    }
    setResults(results);
    setWarnings(warnings);
    setEngineeringNotes(notes);
    setCostAnalysis(cost);
  }, [
  poleHeight, poleClass, poleLatitude, poleLongitude, existingPowerHeight, existingPowerVoltage,
    spanDistance, isNewConstruction, adjacentPoleHeight,
    attachmentType, cableDiameter, windSpeed, spanEnvironment,
    streetLightHeight, dripLoopHeight, proposedLineHeight,
  existingLines, iceThicknessIn, hasTransformer, presetProfile,
  customMinTopSpace, customRoadClearance, customCommToPower, powerReference, jobOwner, submissionProfiles, currentSubmissionProfile,
    setResults, setWarnings, setEngineeringNotes, setMakeReadyNotes, setCostAnalysis
  ]);

  // Simple results panel + inputs
  const useDeviceGPS = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords || {};
      if (latitude != null && longitude != null) {
        setPoleLatitude(latitude.toFixed(6));
        setPoleLongitude(longitude.toFixed(6));
      }
    } catch (e) {
      alert(`Failed to get location: ${e?.message || e}`);
    }
  };

  return (
    <div className="p-3 md:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-xl font-semibold">Pole Plan Wizard</h1>
          <span className="hidden sm:inline text-xs text-gray-600">Job:</span>
          <select className="hidden sm:inline text-xs border rounded px-1 py-0.5" value={currentJobId || ''} onChange={e=>setCurrentJobId(e.target.value)}>
            <option value="">-- None --</option>
            {(jobs||[]).map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div className="text-xs text-gray-600 hidden sm:block">
          Click <button 
            className="text-blue-600 hover:text-blue-800 underline" 
            onClick={() => setShowHelp(true)}
          >Here</button> for Use Directions
        </div>
      </div>
  {!showReport && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
         <Input label="Project Name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
         <Input label="Applicant" value={applicantName} onChange={e=>setApplicantName(e.target.value)} />
         <Input label="Job #" value={jobNumber} onChange={e=>setJobNumber(e.target.value)} />
        <LogoUpload />
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Pole Latitude" value={poleLatitude} onChange={e=>setPoleLatitude(e.target.value)} placeholder="e.g., 40.123456" />
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Input label="Pole Longitude" value={poleLongitude} onChange={e=>setPoleLongitude(e.target.value)} placeholder="e.g., -82.987654" />
            <button type="button" className="h-9 px-3 border rounded text-sm" onClick={useDeviceGPS} title="Use device GPS">
              Use GPS
            </button>
          </div>
        </div>
         <Select label="Preset Profile" value={presetProfile} onChange={e=>setPresetProfile(e.target.value)} options={[{label:'None',value:''}, ...Object.values(DEFAULTS.presets).map(p=>({label:p.label,value:p.value}))]} />
         <Select label="Submission Profile" value={(useAppStore.getState().jobs||[]).find(j=>j.id===useAppStore.getState().currentJobId)?.submissionProfileName || currentSubmissionProfile} onChange={e=>{
           const job = (useAppStore.getState().jobs||[]).find(j=>j.id===useAppStore.getState().currentJobId);
           if (job) {
             useAppStore.getState().updateJob(job.id, { submissionProfileName: e.target.value });
           } else {
             setCurrentSubmissionProfile(e.target.value);
           }
         }} options={(submissionProfiles||[]).map(p=>({label:p.label, value:p.name}))} />
         {/* Quick profile tuning */}
         <ProfileTuner />
         <label className="text-sm text-gray-700 grid gap-1">
           <span className="font-medium">Owner (utility)</span>
           <input list="wv-power-companies-inline" className="border rounded px-2 py-1" value={jobOwner} onChange={e=>setJobOwner(e.target.value)} placeholder="e.g., Mon Power, Penelec" />
           <datalist id="wv-power-companies-inline">
             {WV_COMPANIES.power.map(c => <option key={`p-${c.name}`} value={c.short || c.name}>{c.name}</option>)}
           </datalist>
         </label>
         <Input label="Pole Height (ft)" value={poleHeight} onChange={e=>setPoleHeight(e.target.value)} />
         <Input label="Pole Class" value={poleClass} onChange={e=>setPoleClass(e.target.value)} placeholder="e.g., Class 4" />
         <Select label="Construction" value={isNewConstruction ? 'new' : 'existing'} onChange={e=>setIsNewConstruction(e.target.value === 'new')} options={[{label:'New',value:'new'},{label:'Existing',value:'existing'}]} />
         <Select label="Power Voltage" value={existingPowerVoltage} onChange={e=>setExistingPowerVoltage(e.target.value)} options={[{label:'Distribution',value:'distribution'},{label:'Transmission',value:'transmission'},{label:'Communication',value:'communication'}]} />
         <Input label="Existing Power Height (ft/in)" value={existingPowerHeight} onChange={e=>setExistingPowerHeight(e.target.value)} />
         <Checkbox label="Transformer present" checked={!!hasTransformer} onChange={e=>setHasTransformer(e.target.checked)} />
         <Input label="Street Light Height (ft/in)" value={streetLightHeight} onChange={e=>setStreetLightHeight(e.target.value)} />
         <Input label="Drip Loop Height (ft/in)" value={dripLoopHeight} onChange={e=>setDripLoopHeight(e.target.value)} />
         <Select label="Power Reference" value={powerReference} onChange={e=>setPowerReference(e.target.value)} options={[{label:'Auto',value:'auto'},{label:'Neutral',value:'neutral'},{label:'Secondary',value:'secondary'},{label:'Drip Loop',value:'dripLoop'},{label:'Power Conductor',value:'power'}]} />
         <Input label="Span (ft)" value={spanDistance} onChange={e=>setSpanDistance(e.target.value)} />
         <Input label="Adjacent Pole (ft)" value={adjacentPoleHeight} onChange={e=>setAdjacentPoleHeight(e.target.value)} />
         <Select label="Cable" value={attachmentType} onChange={e=>setAttachmentType(e.target.value)} options={DEFAULTS.cableTypes.map(c=>({label:c.label,value:c.value}))} />
         <Input label="Cable Diameter (in)" value={cableDiameter} onChange={e=>setCableDiameter(e.target.value)} placeholder="auto from cable" />
         <Input label="Wind (mph)" value={windSpeed} onChange={e=>setWindSpeed(e.target.value)} />
         <Input label="Ice (in)" value={iceThicknessIn} onChange={e=>setIceThicknessIn(e.target.value)} />
        <Select label="Environment" value={spanEnvironment} onChange={e=>setSpanEnvironment(e.target.value)} options={[
          {label:'Road',value:'road'},
          {label:'Interstate',value:'interstate'},
          {label:'Interstate (New Crossing)',value:'interstateNewCrossing'},
          {label:'Residential',value:'residential'},
          {label:'Pedestrian',value:'pedestrian'},
          {label:'Field',value:'field'},
          {label:'Residential Yard',value:'residentialYard'},
          {label:'Residential Driveway',value:'residentialDriveway'},
          {label:'Non-Residential Driveway / Alley / Parking',value:'nonResidentialDriveway'},
          {label:'Waterway',value:'waterway'},
          {label:'WV Highway',value:'wvHighway'},
          {label:'PA Highway',value:'paHighway'},
          {label:'OH Highway',value:'ohHighway'},
          {label:'MD Highway',value:'mdHighway'},
          {label:'Railroad Crossing (CSX)',value:'railroad'},
        ]} />
         <Input label="Proposed Line (ft/in)" value={proposedLineHeight} onChange={e=>setProposedLineHeight(e.target.value)} />
         <Input label="Override Min Top Space (ft)" value={customMinTopSpace} onChange={e=>setCustomMinTopSpace(e.target.value)} placeholder="optional" />
         <Input label="Override Road Clearance (ft)" value={customRoadClearance} onChange={e=>setCustomRoadClearance(e.target.value)} placeholder="optional" />
         <Input label="Override Comm-Power (ft)" value={customCommToPower} onChange={e=>setCustomCommToPower(e.target.value)} placeholder="optional" />
         <Select label="Display Format" value={useTickMarkFormat ? 'ticks' : 'verbose'} onChange={e=>setUseTickMarkFormat(e.target.value === 'ticks')} options={[{label:'Verbose (15ft 6in)',value:'verbose'},{label:'Tick Marks (15\' 6")',value:'ticks'}]} />
       </div>
  )}

      {!showReport && (
        <>
          <ImportPanel />
          <SpansEditor />
          <ExistingLinesEditor />
          <FieldCollection openHelp={(section)=>{ setHelpSection(section); setShowHelp(true); }} />
        </>
      )}

  <div className="flex flex-col sm:flex-row sm:items-center gap-2 no-print">
        <ScenarioButtons />
        <ExportButtons />
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setShowBatchReport(false); setShowReport(r=>!r); }}>{showReport ? 'Back to Editor' : 'View Report'}</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setShowReport(false); setShowBatchReport(b=>!b); }} disabled={!useAppStore.getState().importedSpans.length}>{showBatchReport ? 'Back to Editor' : 'Batch Report'}</button>
      </div>

      {showReport ? <PrintableReport /> : showBatchReport ? <BatchReport /> : <ResultsPanel />}
      <AgencyTemplatesPanel />
      <FormAutofillPanel />
      
  <HelpModal open={showHelp} onClose={() => setShowHelp(false)} initialSection={helpSection} />
    </div>
  );
}

// --- As-built variance helpers (FirstEnergy/Mon Power defaults) ---
function getAttachToleranceIn(presetProfile) {
  const p = DEFAULTS.presets[presetProfile];
  return p?.asBuiltTolerances?.attachHeightIn ?? 2; // default 2 inches
}
function computeVarianceIn(asBuiltAttach, plannedAttach) {
  const a = parseFeet(asBuiltAttach);
  const p = parseFeet(plannedAttach);
  if (a == null || p == null) return '';
  const deltaIn = Math.round((a - p) * 12);
  return String(deltaIn);
}
function evaluateVariancePass(asBuiltAttach, plannedAttach, presetProfile) {
  const a = parseFeet(asBuiltAttach);
  const p = parseFeet(plannedAttach);
  if (a == null || p == null) return '';
  const tol = getAttachToleranceIn(presetProfile);
  const deltaAbs = Math.abs((a - p) * 12);
  return deltaAbs <= tol ? 'PASS' : 'FAIL';
}

function AutoMapPreviewModal({ open, onClose, current, proposal, onApply }) {
  if (!open || !proposal) return null;
  const groups = ['pole','span','line'];
  const diff = (a, b) => a === b ? 'text-gray-600' : 'text-blue-700';
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[90vw] max-w-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Auto-map Preview</div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="text-xs text-gray-600 mb-3">Review proposed field mappings and click Apply to use them.</div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {groups.map(g => (
            <div key={g} className="border rounded p-2">
              <div className="font-medium mb-1">{g}</div>
              {Object.entries(proposal[g] || {}).map(([k, v]) => (
                <div key={k} className="grid gap-0.5 mb-1">
                  <div className="text-xs uppercase text-gray-500">{k}</div>
                  <div className="text-xs text-gray-600">Current: <span className="font-mono">{current[g]?.[k] || ''}</span></div>
                  <div className={`text-xs ${diff(current[g]?.[k], v)}`}>Proposed: <span className="font-mono">{v}</span></div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button className="px-2 py-1 border rounded text-sm" onClick={onApply}>Apply</button>
          <button className="px-2 py-1 border rounded text-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="text-sm text-gray-700 grid gap-1">
      <span className="font-medium">{label}</span>
      <input className="border rounded px-2 py-1" {...props} />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="text-sm text-gray-700 grid gap-1">
      <span className="font-medium">{label}</span>
      <select className="border rounded px-2 py-1" {...props}>
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Checkbox({ label, ...props }) {
  return (
    <label className="text-sm text-gray-700 inline-flex items-center gap-2 mt-5">
      <input type="checkbox" className="h-4 w-4" {...props} />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function ProfileTuner() {
  const store = useAppStore();
  const { submissionProfiles, currentSubmissionProfile, updateSubmissionProfile } = store;
  const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
  const baseProfileName = activeJob?.submissionProfileName || currentSubmissionProfile;
  const base = (submissionProfiles||[]).find(x => x.name === baseProfileName);
  if (!base) return null;
  const effective = { ...base, ...(activeJob?.submissionProfileOverrides || {}) };

  const onChangeGlobal = (key, val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return;
    updateSubmissionProfile(base.name, { [key]: num });
  };
  const onChangeJob = (key, val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return;
    store.updateJob(activeJob.id, { submissionProfileOverrides: { ...(activeJob.submissionProfileOverrides||{}), [key]: num } });
  };
  const onResetJobOverrides = () => {
    if (!activeJob) return;
    store.updateJob(activeJob.id, { submissionProfileOverrides: {} });
  };

  const Editor = ({ label, field, unit }) => (
    <label className="text-sm text-gray-700 grid gap-1">
      <span className="font-medium">{label}</span>
      <input
        className="border rounded px-2 py-1"
        value={effective[field] ?? ''}
        onChange={e=> activeJob ? onChangeJob(field, e.target.value) : onChangeGlobal(field, e.target.value)}
        placeholder={activeJob ? 'override (blank uses profile)' : ''}
      />
      <span className="text-xs text-gray-500">{unit}</span>
    </label>
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      <Editor label="Comm→Power" field="commToPowerIn" unit={'in'} />
      <Editor label="Min Top Space" field="minTopSpaceFt" unit={'ft'} />
      <Editor label="Road Clearance" field="roadClearanceFt" unit={'ft'} />
  <Editor label="Road Midspan Target" field="envRoadFt" unit={'ft'} />
  <Editor label="Residential Midspan Target" field="envResidentialFt" unit={'ft'} />
  <Editor label="Pedestrian Midspan Target" field="envPedestrianFt" unit={'ft'} />
  <Editor label="Field Midspan Target" field="envFieldFt" unit={'ft'} />
  <Editor label="Residential Yard Target" field="envResidentialYardFt" unit={'ft'} />
  <Editor label="Residential Driveway Target" field="envResidentialDrivewayFt" unit={'ft'} />
  <Editor label="Waterway Midspan Target" field="envWaterwayFt" unit={'ft'} />
  <Editor label="WV Highway Target" field="envWVHighwayFt" unit={'ft'} />
  <Editor label="PA Highway Target" field="envPAHighwayFt" unit={'ft'} />
  <Editor label="OH Highway Target" field="envOHHighwayFt" unit={'ft'} />
  <Editor label="MD Highway Target" field="envMDHighwayFt" unit={'ft'} />
  <Editor label="Non-Residential Driveway Target" field="envNonResidentialDrivewayFt" unit={'ft'} />
  <Editor label="Interstate Target" field="envInterstateFt" unit={'ft'} />
  <Editor label="Interstate (New Crossing) Target" field="envInterstateNewCrossingFt" unit={'ft'} />
  <Editor label="Railroad Crossing Target" field="envRailroadFt" unit={'ft'} />
  <Editor label="Min Comm Attach Height" field="minCommAttachFt" unit={'ft'} />
      {activeJob ? (
        <div className="col-span-3 text-xs text-gray-600">
          Using job-specific overrides. <button className="underline" onClick={onResetJobOverrides}>Reset overrides</button>
        </div>
      ) : (
        <div className="col-span-3 text-xs text-gray-600">Editing global submission profile defaults.</div>
      )}
    </div>
  );
}

function ResultsPanel() {
  const { results, warnings, engineeringNotes, costAnalysis, makeReadyNotes, useTickMarkFormat } = useAppStore();
  if (!results) return <div className="text-gray-600">Enter inputs to see results.</div>;
  const { clearances } = results;
  const fmt = useTickMarkFormat ? formatFeetInchesTickMarks : formatFeetInchesVerbose;
  return (
    <div className="grid gap-4">
      <div className="rounded border p-3">
        <div className="font-medium mb-2">Pole</div>
        <div className="text-sm text-gray-700">
          <div>Height: {fmt(results.pole.inputHeight)}</div>
          <div>Buried: {fmt(results.pole.buriedFt)}</div>
          <div>Above ground: {fmt(results.pole.aboveGroundFt)}</div>
          <div>Class: {results.pole.classInfo}</div>
          {(results.pole.latitude != null && results.pole.longitude != null) ? (
            <div>GPS: {results.pole.latitude}, {results.pole.longitude}</div>
          ) : null}
        </div>
      </div>
      <div className="rounded border p-3">
        <div className="font-medium mb-2">Attachment & Span</div>
        <div className="text-sm text-gray-700">
          <div>Proposed attach: {fmt(results.attach.proposedAttachFt)}</div>
          {results.attach.recommendation ? (
            <div className="text-xs text-gray-600">Basis: {results.attach.recommendation.basis} — {results.attach.recommendation.detail}</div>
          ) : null}
          <div>Span: {results.span.spanFt} ft</div>
          <div>Wind: {results.span.wind} mph</div>
          <div>Sag: {fmt(results.span.sagFt)}</div>
          <div>Midspan: {fmt(results.span.midspanFt)}</div>
          <div className="my-2">
            <SpanDiagram attachFt={results.attach.proposedAttachFt} midspanFt={results.span.midspanFt} spanFt={results.span.spanFt} groundTargetFt={results.clearances.groundClearance} />
          </div>
          {results.guy ? (
            <div className="mt-2">
              <div className="font-medium">Guying</div>
              <div>Required: {results.guy.required ? 'Yes' : 'No'}</div>
              <div>Tension: {results.guy.tension?.toFixed(0)} lb</div>
              <div>Angle: {results.guy.angle?.toFixed(0)}°</div>
              <div>Lead: {results.guy.leadDistance?.toFixed(1)} ft</div>
              <div>Guy attach height: {fmt(results.guy.guyHeight)}</div>
              {results.guy.totalCost ? <div>Guy cost: ${results.guy.totalCost}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="rounded border p-3">
        <div className="font-medium mb-2">Clearances (targets)</div>
        <div className="text-sm text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
          <div>Ground: {fmt(clearances.groundClearance)}</div>
          <div>Road: {fmt(clearances.roadClearance)}</div>
          <div>Min top space: {fmt(clearances.minimumPoleTopSpace)}</div>
          {'powerClearanceDistribution' in clearances && (
            <div>Power (dist): {fmt(clearances.powerClearanceDistribution)}</div>
          )}
          {'powerClearanceTransmission' in clearances && (
            <div>Power (trans): {fmt(clearances.powerClearanceTransmission)}</div>
          )}
        </div>
      </div>
  <CompliancePanel />
      {makeReadyNotes ? (
        <div className="rounded border p-3">
          <div className="font-medium mb-2">Make-ready</div>
          <pre className="text-xs whitespace-pre-wrap text-gray-700">{makeReadyNotes}</pre>
          <div className="text-sm text-gray-700 mt-2">Make-ready total: ${results.makeReadyTotal ?? 0}</div>
        </div>
      ) : null}
      {warnings?.length ? (
        <div className="rounded border border-yellow-300 bg-yellow-50 p-3">
          <div className="font-medium mb-2">Warnings</div>
          <ul className="list-disc pl-5 text-sm text-yellow-800">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      ) : null}
      {engineeringNotes?.length ? (
        <div className="rounded border p-3">
          <div className="font-medium mb-2">Notes</div>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {engineeringNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="text-sm text-gray-600">Estimated cost: ${costAnalysis ?? 0}</div>
    </div>
  );
}

function AgencyTemplatesPanel() {
  const store = useAppStore();
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        const { getTemplatesForEnvironment } = await import('../utils/permitTemplates');
        const list = getTemplatesForEnvironment(store.spanEnvironment);
        setItems(list || []);
      } catch (e) {
        if (import.meta?.env?.DEV) console.warn('Templates load failed', e);
      }
    })();
  }, [store.spanEnvironment]);
  if (!items?.length) return null;
  return (
    <div className="rounded border p-3 no-print">
      <div className="font-medium mb-2">Agency Templates & Resources</div>
      <div className="text-xs text-gray-600 mb-2">Environment: {store.spanEnvironment}</div>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {items.map((a) => (
          <div key={a.key} className="border rounded p-2">
            <div className="font-medium mb-1">{a.name}</div>
            {a.resources?.length ? (
              <ul className="list-disc pl-5">
                {a.resources.map((r, i) => (
                  <li key={i} className="mb-1">
                    <a className="text-blue-700 underline" href={r.url} target="_blank" rel="noreferrer">{r.label}</a>
                    {r.notes ? <div className="text-xs text-gray-600">{r.notes}</div> : null}
                  </li>
                ))}
              </ul>
            ) : <div className="text-xs text-gray-500">No direct resources listed.</div>}
            {a.requirements?.length ? (
              <div className="mt-2">
                <div className="text-xs uppercase text-gray-500">Common Requirements</div>
                <ul className="list-disc pl-5 text-sm">
                  {a.requirements.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormAutofillPanel() {
  const store = useAppStore();
  const [basePdf, setBasePdf] = React.useState(null);
  const [layoutText, setLayoutText] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [autoPreview, setAutoPreview] = React.useState('');
  const env = store.spanEnvironment;
  const enabled = ['wvHighway','paHighway','ohHighway','mdHighway','railroad'].includes(env);
  const [fields, setFields] = React.useState(null);
  const [presetName, setPresetName] = React.useState('Default');

  // Build normalized fields from current analysis/summary
  React.useEffect(() => {
    (async () => {
      if (!enabled || !store.results) { setFields(null); return; }
      try {
        const job = (useAppStore.getState().jobs||[]).find(j=>j.id===useAppStore.getState().currentJobId);
        const profileName = job?.submissionProfileName || useAppStore.getState().currentSubmissionProfile;
        const baseProfile = (useAppStore.getState().submissionProfiles||[]).find(p=>p.name===profileName) || {};
        const effectiveProfile = { ...baseProfile, ...(job?.submissionProfileOverrides||{}), name: baseProfile?.name };
  const summary = makePermitSummary({ env, results: useAppStore.getState().results, job, effectiveProfile, cachedMidspans: useAppStore.getState().cachedMidspans, store: useAppStore.getState() });
        const { buildMM109Fields, buildCSXFields, buildStateHighwayFields } = await import('../utils/formFields');
        let f;
        if (env === 'railroad') f = buildCSXFields(summary);
        else if (env === 'wvHighway') f = buildMM109Fields(summary);
        else if (env === 'paHighway') f = buildStateHighwayFields(summary, 'PennDOT');
        else if (env === 'ohHighway') f = buildStateHighwayFields(summary, 'ODOT');
        else if (env === 'mdHighway') f = buildStateHighwayFields(summary, 'MDOT SHA');
        else f = buildMM109Fields(summary);
        setFields(f);
        // Provide a small starter layout example for convenience
        setLayoutText(prev => prev || JSON.stringify([
          { key: 'applicant', pageIndex: 0, x: 100, y: 700, size: 10 },
          { key: 'jobName', pageIndex: 0, x: 100, y: 684, size: 10 },
          { key: 'jobNumber', pageIndex: 0, x: 100, y: 668, size: 10 },
          { key: 'poleLatitude', pageIndex: 0, x: 400, y: 700, size: 10 },
          { key: 'poleLongitude', pageIndex: 0, x: 400, y: 684, size: 10 },
        ], null, 2));
      } catch (e) {
        if (import.meta?.env?.DEV) console.warn('Form fields build failed', e);
        setFields(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, env]);

  const onFill = async () => {
    try {
      setStatus('');
      if (!basePdf) { setStatus('Select an official PDF to fill.'); return; }
      if (!fields) { setStatus('Run analysis and select a supported environment.'); return; }
      let layout;
      try { layout = JSON.parse(layoutText || '[]'); } catch { setStatus('Layout JSON is invalid.'); return; }
      const buf = new Uint8Array(await basePdf.arrayBuffer());
      const { fillPdfWithFields } = await import('../utils/pdfFormFiller');
      const outBytes = await fillPdfWithFields(buf, fields, layout);
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'filled-form.pdf'; a.click();
      URL.revokeObjectURL(url);
      setStatus('Filled PDF downloaded.');
    } catch (e) {
      setStatus(`Autofill failed: ${e?.message || e}`);
    }
  };

  const presetsForEnv = React.useMemo(() => {
    const jobId = store.currentJobId || '_global';
    const all = store.pdfLayouts?.[jobId]?.[env] || {};
    return Object.keys(all).sort();
  }, [store.pdfLayouts, store.currentJobId, env]);

  const onSavePreset = () => {
    try {
      const layout = JSON.parse(layoutText || '[]');
      store.savePdfLayout(env, presetName || 'Default', layout);
      setStatus(`Saved preset "${presetName || 'Default'}" for ${env}.`);
    } catch {
      setStatus('Layout JSON is invalid.');
    }
  };
  const onLoadPreset = (name) => {
    const jobId = store.currentJobId || '_global';
    const layout = store.pdfLayouts?.[jobId]?.[env]?.[name];
    if (!layout) { setStatus('Preset not found.'); return; }
    setLayoutText(JSON.stringify(layout, null, 2));
    setPresetName(name);
    setStatus(`Loaded preset "${name}".`);
  };
  const onDeletePreset = (name) => {
    store.removePdfLayout(env, name);
    setStatus(`Deleted preset "${name}".`);
  };

  const onAutoLayout = async () => {
    try {
      setStatus(''); setAutoPreview('');
      if (!basePdf) { setStatus('Select an official PDF to analyze.'); return; }
      const buf = new Uint8Array(await basePdf.arrayBuffer());
      const { getPdfMeta, fillPdfAuto } = await import('../utils/pdfFormFiller');
      const meta = await getPdfMeta(buf);
      const pretty = `${meta.pages} page(s), first ${Math.round(meta.firstPage.width)}x${Math.round(meta.firstPage.height)}`;
      setAutoPreview(`Detected PDF: ${pretty}. Using default layout for ${env}.`);
      if (!fields) { setStatus('Run analysis first for normalized fields.'); return; }
      const outBytes = await fillPdfAuto(buf, env, fields);
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'filled-form-auto.pdf'; a.click();
      URL.revokeObjectURL(url);
      setStatus('Auto-filled PDF downloaded.');
    } catch (e) {
      setStatus(`Auto-layout failed: ${e?.message || e}`);
    }
  };

  const onFillByForm = async () => {
    try {
      setStatus('');
      if (!basePdf) { setStatus('Select an official PDF to fill.'); return; }
      if (!fields) { setStatus('Run analysis and select a supported environment.'); return; }
      const buf = new Uint8Array(await basePdf.arrayBuffer());
      const { fillAcroFormByName } = await import('../utils/pdfFormFiller');
      const outBytes = await fillAcroFormByName(buf, env, fields);
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'filled-form-fields.pdf'; a.click();
      URL.revokeObjectURL(url);
      setStatus('Filled PDF (form fields) downloaded.');
    } catch (e) {
      setStatus(`Form fill failed: ${e?.message || e}`);
    }
  };

  if (!enabled) return null;
  return (
    <div className="rounded border p-3 no-print">
      <div className="font-medium mb-2">Form Autofill (Upload Official PDF)</div>
      <div className="text-xs text-gray-600 mb-2">Use this helper to overlay your current job fields onto an official PDF template. Provide a simple layout JSON mapping (key → page/x/y/size). Start with the example and adjust coordinates to your form.</div>
      <div className="grid md:grid-cols-3 gap-2 items-end">
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Official PDF</span>
          <input type="file" accept="application/pdf" onChange={e=>setBasePdf(e.target.files?.[0]||null)} />
        </label>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 grid gap-1">
            <span className="font-medium">Layout JSON</span>
            <textarea className="border rounded p-2 text-xs h-28" value={layoutText} onChange={e=>setLayoutText(e.target.value)} placeholder='[{"key":"applicant","pageIndex":0,"x":100,"y":700,"size":10}]' />
          </label>
        </div>
      </div>
      <div className="mt-2 grid md:grid-cols-3 gap-2 items-end">
        <div className="grid gap-1 text-sm text-gray-700">
          <span className="font-medium">Preset Name</span>
          <input className="border rounded px-2 py-1" value={presetName} onChange={e=>setPresetName(e.target.value)} placeholder="Default" />
        </div>
        <div className="flex items-end gap-2">
          <button className="px-2 py-1 border rounded text-sm" onClick={onSavePreset} disabled={!layoutText}>Save Preset</button>
          <div className="text-xs text-gray-600">Scope: {store.currentJobId ? 'Job' : 'Global'} | Env: {env}</div>
        </div>
        <div className="flex items-end gap-2">
          <select className="border rounded px-2 py-1 text-sm" onChange={(e)=>e.target.value && onLoadPreset(e.target.value)} value="">
            <option value="" disabled>Load preset…</option>
            {presetsForEnv.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="px-2 py-1 border rounded text-sm" onClick={()=>presetName && onDeletePreset(presetName)} disabled={!presetName}>Delete</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button className="px-2 py-1 border rounded text-sm" onClick={onFill} disabled={!basePdf || !fields}>Fill PDF</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={onAutoLayout} disabled={!basePdf || !fields}>Auto-Layout & Fill</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={onFillByForm} disabled={!basePdf || !fields}>Fill by Form Fields</button>
        <div className="text-xs text-gray-600">{status}</div>
      </div>
      {autoPreview ? <div className="text-xs text-amber-700 mt-1">{autoPreview}</div> : null}
      {fields ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-700">Normalized Fields (available keys)</summary>
          <pre className="text-[11px] bg-gray-50 p-2 rounded overflow-auto max-h-64">{JSON.stringify(fields, null, 2)}</pre>
        </details>
      ) : null}
    </div>
  );
}

function CompliancePanel() {
  const store = useAppStore();
  const { results } = store;
  if (!results) return null;
  const fmt = store.useTickMarkFormat ? formatFeetInchesTickMarks : formatFeetInchesVerbose;
  const mid = results.span.midspanFt;
  const groundTarget = results.clearances.groundClearance;
  const groundOK = mid == null ? true : mid >= groundTarget;
  const commToPowerTarget = results.clearances.powerClearanceDistribution || 40/12;
  const powerHt = parseFeet(store.existingPowerHeight);
  const proposed = results.attach.proposedAttachFt;
  const sep = (powerHt != null && proposed != null) ? (powerHt - proposed) : null;
  const sepOK = sep == null ? true : sep >= commToPowerTarget;
  const inchesUsed = Math.round((commToPowerTarget || 0) * 12);
  // Effective submission profile for trace
  const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
  const profileName = activeJob?.submissionProfileName || store.currentSubmissionProfile;
  const baseProfile = (store.submissionProfiles||[]).find(p=>p.name===profileName) || {};
  const effectiveProfile = { ...baseProfile, ...(activeJob?.submissionProfileOverrides||{}), name: baseProfile?.name };
  const rec = results.attach?.recommendation || {};
  return (
    <div className="rounded border p-3">
      <div className="font-medium mb-2">Standards Compliance</div>
      <div className="text-sm grid md:grid-cols-2 gap-2">
        <div className={groundOK ? 'text-emerald-700' : 'text-red-700'}>
          Ground/Midspan: {mid != null ? fmt(mid) : '—'} vs target {fmt(groundTarget)} — {groundOK ? 'PASS' : 'FAIL'}
        </div>
        <div className={sepOK ? 'text-emerald-700' : 'text-red-700'}>
          Comm-to-Power at pole: {sep != null ? fmt(sep) : '—'} vs target {fmt(commToPowerTarget)} ({inchesUsed}") — {sepOK ? 'PASS' : 'FAIL'}
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-1">FE/Mon Power presets enforce 18 ft over roads and 44" comm-to-power. NESC or utility default is typically 40" when FE doesn’t apply.</div>
      <div className="mt-2 text-xs text-gray-700 grid md:grid-cols-3 gap-2">
        <div>Owner: {store.jobOwner || '—'}</div>
        <div>Profile: {effectiveProfile.name || '—'}</div>
        <div>Min Comm Attach: {effectiveProfile.minCommAttachFt != null ? fmt(effectiveProfile.minCommAttachFt) : '—'}</div>
        <div className="md:col-span-3">Basis: {rec.basis || '—'}{rec.detail ? ` — ${rec.detail}` : ''}</div>
        <div>Separation Used: {rec.clearanceIn != null ? `${rec.clearanceIn}"` : '—'}</div>
        <div>Controlling: {rec.controlling?.name || '—'}{rec.controlling?.ft != null ? ` @ ${fmt(rec.controlling.ft)}` : ''}</div>
      </div>
    </div>
  );
}

function PrintableReport() {
  const { results, warnings, engineeringNotes, makeReadyNotes, costAnalysis, projectName, applicantName, jobNumber, logoDataUrl, existingLines } = useAppStore();
  
  const byCompany = React.useMemo(() => {
    try {
      const agg = (existingLines || []).reduce((acc, r) => {
        if (!r?.makeReady) return acc;
        const base = parseFeet(r.height);
        const next = parseFeet(r.makeReadyHeight);
        if (base == null || next == null) return acc;
        const key = r.companyName || '—';
        const deltaIn = Math.abs(Math.round((next - base) * 12));
        const cost = deltaIn * 12.5;
        const cur = acc[key] || { rows: 0, deltaInches: 0, totalCost: 0 };
        cur.rows += 1; cur.deltaInches += deltaIn; cur.totalCost += cost; acc[key] = cur;
        return acc;
      }, {});
      return Object.entries(agg);
    } catch (error) { 
      console.error('Error aggregating existing lines:', error);
      return []; 
    }
  }, [existingLines]);
  return (
    <div className="grid gap-4 text-left">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pole Attachment Report</h2>
          <div className="text-sm text-gray-600">Project: {projectName || '—'} | Applicant: {applicantName || '—'} | Job #: {jobNumber || '—'}</div>
        </div>
        <div className="text-right">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Logo" className="h-10 inline-block" />
          ) : (
            <div className="text-2xl font-bold">PolePro</div>
          )}
           <div className="text-xs text-gray-500">Generated {new Date().toLocaleDateString()}</div>
         </div>
       </div>
       <div>
         <div className="font-medium">Pole</div>
         <div>Height: {formatFeetInches(results.pole.inputHeight)} | Above-ground: {formatFeetInches(results.pole.aboveGroundFt)} | Buried: {formatFeetInches(results.pole.buriedFt)}</div>
         {(results.pole.latitude != null && results.pole.longitude != null) ? (
           <div>GPS: {results.pole.latitude}, {results.pole.longitude}</div>
         ) : null}
       </div>
       <div>
         <div className="font-medium">Attachment & Span</div>
         <div>Attach: {results.attach.proposedAttachFmt} | Span: {results.span.spanFt} ft | Sag: {results.span.sagFmt} | Midspan: {results.span.midspanFmt}</div>
         <div className="my-2">
           <SpanDiagram attachFt={results.attach.proposedAttachFt} midspanFt={results.span.midspanFt} spanFt={results.span.spanFt} groundTargetFt={results.clearances.groundClearance} />
         </div>
         {results.guy ? <div>Guying: {results.guy.required ? 'Required' : 'Not required'} | Tension: {Math.round(results.guy.tension || 0)} lb | Angle: {Math.round(results.guy.angle || 0)}°</div> : null}
       </div>
       <div>
         <div className="font-medium">Clearances (targets)</div>
         <div>Ground: {formatFeetInches(results.clearances.groundClearance)} | Road: {formatFeetInches(results.clearances.roadClearance)} | Min top: {formatFeetInches(results.clearances.minimumPoleTopSpace)}</div>
       </div>
       {makeReadyNotes ? (
         <div>
           <div className="font-medium">Make-ready</div>
           <pre className="text-xs whitespace-pre-wrap">{makeReadyNotes}</pre>
           <div className="mt-1">Make-ready total: ${results.makeReadyTotal ?? 0}</div>
         </div>
       ) : null}
       {byCompany?.length ? (
         <div>
           <div className="font-medium">Make-ready Summary (by company)</div>
           <table className="w-full text-sm">
             <thead>
               <tr className="text-left text-gray-600">
                 <th className="p-1">Company</th>
                 <th className="p-1">Rows</th>
                 <th className="p-1">Δ (in)</th>
                 <th className="p-1">Est. Cost</th>
               </tr>
             </thead>
             <tbody>
               {byCompany.map(([k,v]) => (
                 <tr key={k} className="border-t">
                   <td className="p-1">{k}</td>
                   <td className="p-1">{v.rows}</td>
                   <td className="p-1">{v.deltaInches}</td>
                   <td className="p-1">${v.totalCost}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       ) : null}
       {warnings?.length ? (
         <div>
           <div className="font-medium">Warnings</div>
           <ul className="list-disc pl-5 text-sm">
             {warnings.map((w, i) => <li key={i}>{w}</li>)}
           </ul>
         </div>
       ) : null}
       {engineeringNotes?.length ? (
         <div>
           <div className="font-medium">Engineering Notes</div>
           <ul className="list-disc pl-5 text-sm">
             {engineeringNotes.map((n, i) => <li key={i}>{n}</li>)}
           </ul>
         </div>
       ) : null}
       <div className="font-semibold">Estimated Cost: ${costAnalysis ?? 0}</div>
       <div className="no-print">
         <button className="px-2 py-1 border rounded text-sm" onClick={()=>window.print()}>Print / Save PDF</button>
       </div>
     </div>
   );
}

function ScenarioButtons() {
  const store = useAppStore();
  const snapshot = () => ({
    poleHeight: store.poleHeight,
    poleClass: store.poleClass,
    existingPowerHeight: store.existingPowerHeight,
    existingPowerVoltage: store.existingPowerVoltage,
    spanDistance: store.spanDistance,
    adjacentPoleHeight: store.adjacentPoleHeight,
    attachmentType: store.attachmentType,
    cableDiameter: store.cableDiameter,
    windSpeed: store.windSpeed,
    spanEnvironment: store.spanEnvironment,
    streetLightHeight: store.streetLightHeight,
    dripLoopHeight: store.dripLoopHeight,
    proposedLineHeight: store.proposedLineHeight,
    iceThicknessIn: store.iceThicknessIn,
    hasTransformer: store.hasTransformer,
    presetProfile: store.presetProfile,
    existingLines: store.existingLines,
  });
  const load = (snap) => {
    if (!snap) return;
    store.setPoleHeight(snap.poleHeight);
    store.setPoleClass(snap.poleClass);
    store.setExistingPowerHeight(snap.existingPowerHeight);
    store.setExistingPowerVoltage(snap.existingPowerVoltage);
    store.setSpanDistance(snap.spanDistance);
    store.setAdjacentPoleHeight(snap.adjacentPoleHeight);
    store.setAttachmentType(snap.attachmentType);
    store.setCableDiameter(snap.cableDiameter);
    store.setWindSpeed(snap.windSpeed);
    store.setSpanEnvironment(snap.spanEnvironment);
    store.setStreetLightHeight(snap.streetLightHeight);
    store.setDripLoopHeight(snap.dripLoopHeight);
    store.setProposedLineHeight(snap.proposedLineHeight);
    store.setIceThicknessIn(snap.iceThicknessIn);
    store.setHasTransformer(snap.hasTransformer);
    store.setPresetProfile(snap.presetProfile);
    store.setExistingLines(snap.existingLines);
  };
  return (
    <div className="flex items-center gap-2 my-2">
      <button className="px-2 py-1 border rounded text-sm" onClick={()=>store.setScenarioA(snapshot())}>Save A</button>
      <button className="px-2 py-1 border rounded text-sm" onClick={()=>store.setScenarioB(snapshot())}>Save B</button>
      <button className="px-2 py-1 border rounded text-sm" onClick={()=>load(store.scenarioA)} disabled={!store.scenarioA}>Load A</button>
      <button className="px-2 py-1 border rounded text-sm" onClick={()=>load(store.scenarioB)} disabled={!store.scenarioB}>Load B</button>
    </div>
  );
}

function ExportButtons() {
  const { results, warnings, makeReadyNotes, useTickMarkFormat } = useAppStore();
  const onCSV = () => {
    const csv = resultsToCSV(results, warnings, makeReadyNotes, { useTickMarks: useTickMarkFormat });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pole-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const onPDF = () => {
    // Lightweight: trigger browser print to save as PDF
    window.print();
  };
  return (
    <div className="flex items-center gap-2 my-2">
      <button className="px-2 py-1 border rounded text-sm" onClick={onCSV} disabled={!results}>Export CSV</button>
      <button className="px-2 py-1 border rounded text-sm" onClick={onPDF} disabled={!results}>Export PDF</button>
      <PermitPackButton />
    </div>
  );
}

function PermitPackButton() {
  const store = useAppStore();
  const onPermit = async () => {
    try {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const { buildMM109PDF, buildCSXPDF } = await import('../utils/permits');
  const { buildMM109Fields, buildCSXFields, buildStateHighwayFields } = await import('../utils/formFields');
  const { detectPermitIssues } = await import('../utils/permitChecks');
  const { buildTemplatesText } = await import('../utils/permitTemplates');
      const job = (store.jobs||[]).find(j=>j.id===store.currentJobId);
      const profileName = job?.submissionProfileName || store.currentSubmissionProfile;
      const baseProfile = (store.submissionProfiles||[]).find(p=>p.name===profileName) || {};
      const effectiveProfile = { ...baseProfile, ...(job?.submissionProfileOverrides||{}), name: baseProfile?.name };
      const env = store.spanEnvironment;
      const results = store.results;
  if (!results) { alert('Run analysis first.'); return; }
  // Build standardized summary
  const summary = makePermitSummary({ env, results, job, effectiveProfile, cachedMidspans: store.cachedMidspans, store });
  zip.file('permit/summary.json', JSON.stringify(summary, null, 2));
  // Include normalized fields for easier transcription to official forms
  let fields;
  if (env === 'railroad') {
    fields = buildCSXFields(summary);
  } else if (env === 'wvHighway') {
    fields = buildMM109Fields(summary);
  } else if (env === 'paHighway') {
    fields = buildStateHighwayFields(summary, 'PennDOT');
  } else if (env === 'ohHighway') {
    fields = buildStateHighwayFields(summary, 'ODOT');
  } else if (env === 'mdHighway') {
    fields = buildStateHighwayFields(summary, 'MDOT SHA');
  } else {
    fields = buildMM109Fields(summary);
  }
  zip.file('permit/fields.json', JSON.stringify(fields, null, 2));
  // Include agency templates manifest with links and requirements
  const templatesTxt = buildTemplatesText(env);
  if (templatesTxt) zip.file('permit/templates.txt', templatesTxt);
  // Detect pre-submission issues and include a simple report
  const issues = detectPermitIssues(summary);
  const issuesText = issues.length ? ['# Issues detected','', ...issues.map(x=>`- ${x}`)].join('\n') : '# Issues detected\n\nNone';
  zip.file('permit/issues.txt', issuesText);
      // PCI (Post Construction Inspection) summary from collected poles (scoped to current job)
      try {
        const scopedPoles = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
        if (scopedPoles.length) {
          const header = ['id','latitude','longitude','plannedAttach','asBuiltAttach','varianceIn','variancePass','hasPhoto','status','timestamp'];
          const rows = scopedPoles.map(p => [
            p.id || '',
            p.latitude || '',
            p.longitude || '',
            p.height || '',
            p.asBuilt?.attachHeight || '',
            computeVarianceIn(p.asBuilt?.attachHeight, p.height),
            evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile),
            p.photoDataUrl ? 'Y' : 'N',
            p.status || 'draft',
            p.timestamp || ''
          ]);
          const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
          zip.file('permit/pci-summary.csv', csv);
          // Simple TXT rollup
          const done = scopedPoles.filter(p => (p.status||'draft')==='done').length;
          const pass = scopedPoles.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)==='PASS').length;
          const fail = scopedPoles.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)==='FAIL').length;
          const withPhoto = scopedPoles.filter(p => !!p.photoDataUrl).length;
          const pciTxt = [
            '# PCI Summary',
            '',
            `Total: ${scopedPoles.length}`,
            `Done: ${done}`,
            `PASS: ${pass}`,
            `FAIL: ${fail}`,
            `Photos: ${withPhoto}`
          ].join('\n');
          zip.file('permit/pci-summary.txt', pciTxt);
        }
      } catch {/* non-fatal */}
      // Attach cached midspans CSV
      if ((store.cachedMidspans||[]).length) {
    const rows = [['spanId','environment','spanFt','spanLenSource','midspanFt','targetFt','attachFt','midLat','midLon','fromId','toId','fromLat','fromLon','toLat','toLon','segments']];
        for (const m of (store.cachedMidspans||[])) {
          rows.push([
            m.spanId ?? '',
            m.environment ?? '',
            m.spanFt ?? '',
      m.spanLenSource ?? '',
            m.midspanFt ?? '',
            m.targetFt ?? '',
            m.attachFt ?? '',
            m.midLat ?? '',
            m.midLon ?? '',
            m.fromId ?? '',
            m.toId ?? '',
            m.fromLat ?? '',
            m.fromLon ?? '',
            m.toLat ?? '',
            m.toLon ?? '',
            Array.isArray(m.segments) ? m.segments.map(x=>`${x.env}:${x.portion || ''}`).join('|') : '',
          ]);
        }
        const csv = rows.map(r => r.map(v => String(v).replaceAll('"','""')).map(v => v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
        zip.file('permit/cached-midspans.csv', csv);
        // Also include a simple PASS/FAIL evaluation for midspan vs target
        try {
          const evalRows = [['spanId','environment','midspanFt','targetFt','status']];
          for (const m of (store.cachedMidspans||[])) {
            const ok = (m.midspanFt != null && m.targetFt != null) ? (Number(m.midspanFt) >= Number(m.targetFt)) : '';
            evalRows.push([
              m.spanId ?? '',
              m.environment ?? '',
              m.midspanFt ?? '',
              m.targetFt ?? '',
              ok === '' ? '' : (ok ? 'PASS' : 'FAIL')
            ]);
          }
          const evalCsv = evalRows.map(r => r.map(v => String(v).replaceAll('"','""')).join(',')).join('\n');
          zip.file('permit/midspan-eval.csv', evalCsv);
        } catch {/* ignore */}
      }
  // Generate a minimal SVG plan/profile diagram
  const w = 800, h = 300, margin = 40;
      const groundY = h - margin;
      const scaleY = (ft) => {
        const maxFt = Math.max( (results.attach.proposedAttachFt||0) + 5, (results.span.midspanFt||0) + 5, (results.clearances.groundClearance||0) + 5 );
        const y = groundY - ((ft||0) / Math.max(1,maxFt)) * (h - 2*margin);
        return Math.max(margin, Math.min(groundY, y));
      };
      const x1 = margin + 60, x2 = w - margin - 60;
      const y1 = scaleY(results.attach.proposedAttachFt||0);
      const y2 = scaleY(results.attach.proposedAttachFt||0); // assume similar at neighbor for sketch
      const midY = scaleY(results.span.midspanFt||0);
  const targetY = scaleY((summary?.span?.targetFt ?? results.clearances.groundClearance) || 0);
  const path = `M ${x1} ${y1} Q ${(x1+x2)/2} ${midY} ${x2} ${y2}`;
    // simple scale bar (assume drawing width represents span length)
    const scaleFt = results.span.spanFt || 0;
  const scalePx = (x2 - x1);
  const barX = margin, barY = h - 10;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <rect width="100%" height="100%" fill="#fff"/>\n  <g stroke="#333" stroke-width="2" fill="none">\n    <line x1="${x1}" y1="${groundY}" x2="${x1}" y2="${margin}"/>\n    <line x1="${x2}" y1="${groundY}" x2="${x2}" y2="${margin}"/>\n    <path d="${path}" stroke="#1f77b4"/>\n    <line x1="${margin}" y1="${groundY}" x2="${w-margin}" y2="${groundY}" stroke="#666" stroke-dasharray="4 4"/>\n    <line x1="${margin}" y1="${targetY}" x2="${w-margin}" y2="${targetY}" stroke="#e53935" stroke-dasharray="6 6"/>\n  </g>\n  <g stroke="#000" stroke-width="1" fill="none">\n    <line x1="${barX}" y1="${barY}" x2="${barX+scalePx}" y2="${barY}"/>\n    <line x1="${barX}" y1="${barY-5}" x2="${barX}" y2="${barY+5}"/>\n    <line x1="${barX+scalePx}" y1="${barY-5}" x2="${barX+scalePx}" y2="${barY+5}"/>\n  </g>\n  <g fill="#1f77b4" stroke="none">\n    <circle cx="${x1}" cy="${y1}" r="3"/>\n    <circle cx="${x2}" cy="${y2}" r="3"/>\n    <circle cx="${(x1+x2)/2}" cy="${midY}" r="3"/>\n  </g>\n  <g font-family="sans-serif" font-size="12" fill="#333">\n    <text x="${x1-20}" y="${margin+12}" transform="rotate(-90 ${x1-20} ${margin+12})">Pole</text>\n    <text x="${x2+20}" y="${margin+12}" transform="rotate(90 ${x2+20} ${margin+12})">Pole</text>\n    <text x="${x1+6}" y="${y1-6}" fill="#1f77b4">Attach A</text>\n    <text x="${x2-6}" y="${y2-6}" fill="#1f77b4" text-anchor="end">Attach B</text>\n    <text x="${(x1+x2)/2+6}" y="${midY-8}" fill="#1f77b4">Midspan ${results.span.midspanFt?.toFixed?.(1)||results.span.midspanFt} ft</text>\n    <text x="${(w/2)}" y="${targetY-6}" text-anchor="middle" fill="#e53935">Ground target ${summary?.span?.targetFt?.toFixed?.(1)||summary?.span?.targetFt} ft</text>\n    <text x="${barX+scalePx/2}" y="${barY-6}" text-anchor="middle">~${Math.round(scaleFt)} ft</text>\n    <text x="${margin}" y="20" fill="#555">${summary?.type || ''} — target ${summary?.span?.targetFt || ''} ft (${summary?.span?.targetSource || 'computed'})</text>\n  </g>\n</svg>`;
      zip.file('permit/plan-profile.svg', svg);

      // Optional: include geospatial exports if poles/spans exist in store
      try {
        const { buildGeoJSON } = await import('../utils/geodata');
        const poles = store.collectedPoles || store.importedPoles || [];
        const spans = store.importedSpans || [];
        if ((poles.length || spans.length)) {
          const fc = buildGeoJSON({ poles, spans, job });
          zip.file('permit/geodata.geojson', JSON.stringify(fc, null, 2));
        }
      } catch {
        // non-fatal if geodata builders are unavailable in this context
      }

      // Add draft PDFs when applicable
      if (env === 'wvHighway') {
        const pdf = await buildMM109PDF(summary);
        zip.file('permit/mm109-draft.pdf', pdf);
      } else if (env === 'railroad') {
        const pdf = await buildCSXPDF(summary);
        zip.file('permit/railroad-draft.pdf', pdf);
      } else if (env === 'paHighway' || env === 'ohHighway' || env === 'mdHighway') {
        // No official forms embedded; include fields.json and rely on summary/diagram
        // Future: add draft headers for each DOT if desired
      }
    // README
    // Include PCI totals if we have any collected poles
    const scopedPolesForReadme = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
    const pciDone = scopedPolesForReadme.filter(p => (p.status||'draft')==='done').length;
    const pciPass = scopedPolesForReadme.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)==='PASS').length;
    const pciFail = scopedPolesForReadme.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)==='FAIL').length;
    const pciPhotos = scopedPolesForReadme.filter(p => !!p.photoDataUrl).length;
    // Variance buckets (inches)
    const bucket = (v) => {
      const a = Math.abs(Number(v)||0);
      if (a <= 2) return '≤2"';
      if (a <= 6) return '3–6"';
      if (a <= 12) return '7–12"';
      return '>12"';
    };
    const byBucket = { '≤2"':0, '3–6"':0, '7–12"':0, '>12"':0 };
    for (const p of scopedPolesForReadme) {
      const planned = Number(p.height)||0;
      const built = Number(p.asBuilt?.attachHeight)||0;
      if (!planned || !built) continue;
      const v = (built - planned) * 12; // inches
      byBucket[bucket(v)]++;
    }
  const readme = [
        '# Permit Package',
        '',
        `Type: ${summary.type}`,
        `Job: ${summary.job.name} (${summary.job.jobNumber})`,
        `Environment: ${env}`,
    `Submission Profile: ${summary.job.submissionProfileName || (effectiveProfile?.name || '')}`,
    `Manifest Type: ${effectiveProfile?.manifestType || ''}`,
    `Target Source: ${summary?.span?.targetSource || 'computed'}`,
    `Issues: ${issues.length}`,
        '',
  (scopedPolesForReadme.length ? `PCI Totals — Done: ${pciDone} | PASS: ${pciPass} | FAIL: ${pciFail} | Photos: ${pciPhotos}` : ''),
  (scopedPolesForReadme.length ? `Variance buckets (in): ≤2: ${byBucket['≤2"']} | 3–6: ${byBucket['3–6"']} | 7–12: ${byBucket['7–12"']} | >12: ${byBucket['>12"']}` : ''),
  scopedPolesForReadme.length ? '' : '',
  'Files:',
        '- summary.json: Data used to prepare the application',
  '- fields.json: Normalized key-value fields for form population (MM109/CSX)',
  '- plan-profile.svg: Simple plan/profile diagram',
  '- templates.txt: Official template links and requirements for the selected agency',
  '- cached-midspans.csv: Cached spans with midspan/target used (when available)',
  '- midspan-eval.csv: PASS/FAIL evaluation of cached midspans versus targets',
  '- pci-summary.csv: Post Construction Inspection rollup for collected poles (if any)',
  '- pci-summary.txt: Totals for PCI (done/pass/fail/photos)',
  '- checklist.txt: Pre-submission checklist to validate required fields',
  '- issues.txt: Auto-detected missing fields or data gaps',
  env === 'wvHighway' ? '- mm109-draft.pdf: Draft application with populated fields' : '',
  (env === 'paHighway' || env === 'ohHighway' || env === 'mdHighway') ? '- (no draft PDF included; use fields.json + summary)' : '',
  env === 'railroad' ? '- railroad-draft.pdf: Draft CSX application with populated fields' : '',
      ].join('\n');
      zip.file('permit/README.txt', readme);
      // Simple checklist to help validate required fields before submission
      const checklist = [
        '# Pre-submission Checklist',
        '',
        `- [${summary.job.name ? 'x' : ' '}] Job name`,
        `- [${summary.job.jobNumber ? 'x' : ' '}] Job number`,
        `- [${summary.job.applicant ? 'x' : ' '}] Applicant`,
        `- [${summary.pole.heightFt ? 'x' : ' '}] Pole height`,
        `- [${summary.power.heightFt ? 'x' : ' '}] Power height`,
        `- [${summary.span.lengthFt ? 'x' : ' '}] Span length`,
        `- [${summary.span.midspanFt ? 'x' : ' '}] Midspan`,
        `- [${summary.span.targetFt ? 'x' : ' '}] Ground clearance target`,
        '',
        'Attach supporting photos, maps, and any utility-specific forms as needed.'
      ].join('\n');
      zip.file('permit/checklist.txt', checklist);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${summary.type.replace(/[^A-Za-z0-9_-]/g,'_')}_permit_pack.zip`; a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Permit pack failed: ${e?.message||e}`);
    }
  };
  const isTargetEnv = ['wvHighway','paHighway','ohHighway','mdHighway','railroad'].includes(store.spanEnvironment);
  return (
    <button className="px-2 py-1 border rounded text-sm" onClick={onPermit} disabled={!store.results || !isTargetEnv} title={isTargetEnv ? 'Generate permit package' : 'Select WV Highway or Railroad environment'}>
      Export Permit Pack
    </button>
  );
}

function FieldCollection({ openHelp }) {
  const store = useAppStore();
  const [poleId, setPoleId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [currentPhotoDataUrl, setCurrentPhotoDataUrl] = React.useState('');
  const fileInputRefLibrary = React.useRef(null);
  const fileInputRefCamera = React.useRef(null);
  const [filterStatus, setFilterStatus] = React.useState('all'); // all|draft|done
  const [filterPhoto, setFilterPhoto] = React.useState('all'); // all|with|without
  const [filterPass, setFilterPass] = React.useState('all'); // all|pass|fail
  const [includePhotos, setIncludePhotos] = React.useState(true);
  const [exifTimestamp, setExifTimestamp] = React.useState('');

  const handleRowGPS = async (rowIndex) => {
    if (!('geolocation' in navigator)) { alert('Geolocation not supported'); return; }
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
      const { latitude, longitude } = pos.coords || {};
      if (latitude != null && longitude != null) {
        store.updateCollectedPole(rowIndex, { latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) });
      }
    } catch (e) { alert(`Failed to get location: ${e?.message || e}`); }
  };

  const onDone = async () => {
    setSaving(true);
    try {
      const id = poleId || `${(store.collectedPoles?.length || 0) + 1}`;
      const item = {
        id,
        latitude: store.poleLatitude || '',
        longitude: store.poleLongitude || '',
        height: store.poleHeight || '',
        poleClass: store.poleClass || '',
        powerHeight: store.existingPowerHeight || '',
        voltage: store.existingPowerVoltage || 'distribution',
        hasTransformer: !!store.hasTransformer,
        spanDistance: store.spanDistance || '',
        adjacentPoleHeight: store.adjacentPoleHeight || '',
        attachmentType: store.attachmentType || '',
        status: 'done',
        photoDataUrl: currentPhotoDataUrl || '',
  timestamp: exifTimestamp || new Date().toISOString(),
  jobId: store.currentJobId || '',
      };
      store.addCollectedPole(item);
      setPoleId('');
      // Optionally clear coordinates to encourage fresh GPS per pole
      store.setPoleLatitude('');
      store.setPoleLongitude('');
      setCurrentPhotoDataUrl('');
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = async () => {
    setSaving(true);
    try {
      const id = poleId || `${(store.collectedPoles?.length || 0) + 1}`;
      const item = {
        id,
        latitude: store.poleLatitude || '',
        longitude: store.poleLongitude || '',
        height: store.poleHeight || '',
        poleClass: store.poleClass || '',
        powerHeight: store.existingPowerHeight || '',
        voltage: store.existingPowerVoltage || 'distribution',
        hasTransformer: !!store.hasTransformer,
        spanDistance: store.spanDistance || '',
        adjacentPoleHeight: store.adjacentPoleHeight || '',
        attachmentType: store.attachmentType || '',
        status: 'draft',
        photoDataUrl: currentPhotoDataUrl || '',
  timestamp: exifTimestamp || new Date().toISOString(),
  jobId: store.currentJobId || '',
      };
      store.addCollectedPole(item);
      setPoleId('');
      // keep GPS for quick successive drafts
      setCurrentPhotoDataUrl('');
    } finally {
      setSaving(false);
    }
  };

  const onSelectPhoto = async (file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        setCurrentPhotoDataUrl(dataUrl);
        // Try EXIF extraction (GPS + DateTime)
        try {
          const { default: exifr } = await import('exifr');
          const exif = await exifr.parse(file, { gps: true });
          if (exif) {
            const lat = exif.latitude;
            const lon = exif.longitude;
            const dt = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;
            if (typeof lat === 'number' && typeof lon === 'number') {
              // Do not override if already set; otherwise fill from EXIF
              if (!store.poleLatitude) store.setPoleLatitude(lat.toFixed(6));
              if (!store.poleLongitude) store.setPoleLongitude(lon.toFixed(6));
            }
            if (dt && !isNaN(new Date(dt))) {
              setExifTimestamp(new Date(dt).toISOString());
  setExifTimestamp('');
  setExifTimestamp('');
            }
          }
        } catch (e) {
          if (import.meta?.env?.DEV) console.warn('EXIF parse failed', e);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      // log only in dev to avoid noisy console in prod
      if (import.meta?.env?.DEV) console.warn('Photo selection failed', e);
    }
  };

  const exportCollected = () => {
    const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    const header = ['id','latitude','longitude','height','class','powerHeight','voltage','hasTransformer','spanDistance','adjacentPoleHeight','attachmentType','status','hasPhoto','timestamp','asBuiltAttachHeight','asBuiltPowerHeight','varianceIn','variancePass','commCompany'];
    const rows = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId).map(p => [
      p.id || '', p.latitude || '', p.longitude || '', p.height || '', p.poleClass || '', p.powerHeight || '', p.voltage || '', p.hasTransformer ? 'Y' : 'N', p.spanDistance || '', p.adjacentPoleHeight || '', p.attachmentType || '', (p.status || 'draft'), (p.photoDataUrl ? 'Y' : 'N'), p.timestamp || '',
      p.asBuilt?.attachHeight || '', p.asBuilt?.powerHeight || '',
      computeVarianceIn(p.asBuilt?.attachHeight, p.height), evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile),
      activeJob?.commCompany || ''
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collected-poles.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportFirst25 = () => {
    const subset = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId).slice(0, 25);
    const header = ['id','latitude','longitude','height','class','powerHeight','voltage','hasTransformer','spanDistance','adjacentPoleHeight','attachmentType','status','hasPhoto','timestamp','asBuiltAttachHeight','asBuiltPowerHeight','varianceIn','variancePass'];
    const rows = subset.map(p => [
      p.id || '', p.latitude || '', p.longitude || '', p.height || '', p.poleClass || '', p.powerHeight || '', p.voltage || '', p.hasTransformer ? 'Y' : 'N', p.spanDistance || '', p.adjacentPoleHeight || '', p.attachmentType || '', (p.status || 'draft'), (p.photoDataUrl ? 'Y' : 'N'), p.timestamp || '',
      p.asBuilt?.attachHeight || '', p.asBuilt?.powerHeight || '',
      computeVarianceIn(p.asBuilt?.attachHeight, p.height), evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collected-poles-first-25.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportSpansZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const polesAll = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
      const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
      const effectiveProfile = (()=>{
        const baseName = activeJob?.submissionProfileName || store.currentSubmissionProfile;
        const base = (store.submissionProfiles||[]).find(p=>p.name===baseName) || {};
        return { ...base, ...(activeJob?.submissionProfileOverrides||{}), name: base?.name };
      })();
      // annotate variance for FE manifest convenience
      const poles = polesAll.map(p => ({
        ...p,
        _varianceIn: computeVarianceIn(p.asBuilt?.attachHeight, p.height),
        _variancePass: evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)
      }));
      const { header, rows, fileLabel } = buildManifest('firstEnergy', poles, activeJob);
      zip.file('manifest.csv', csvFrom(header, rows));
      // Include job profile summary
      zip.file('job-profile.json', JSON.stringify({ jobId: activeJob?.id || '', jobName: activeJob?.name || '', owner: activeJob?.jobOwner || store.jobOwner || '', commCompany: activeJob?.commCompany || '', submissionProfile: effectiveProfile, includePhotos }, null, 2));
      // Photos folder (optional) + index
      if (includePhotos) {
        const photos = zip.folder('photos');
        const index = [];
        for (const p of poles) {
          if (!p.photoDataUrl) continue;
          const safeId = p.id ? String(p.id).replaceAll(/[^A-Za-z0-9_-]/g,'_') : `row-${index.length+1}`;
          const dataUrl = String(p.photoDataUrl);
          const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
          const mime = m?.[1] || 'image/jpeg';
          const base64 = m?.[2] || dataUrl.split(',')[1];
          const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
          const file = `${safeId}.${ext}`;
          if (base64) { photos.file(file, base64, { base64: true }); index.push(`${safeId},${file},${mime}`); }
        }
        if (index.length) photos.file('index.csv', ['id,file,mime', ...index].join('\n'));
      }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${fileLabel}.zip`; a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(`ZIP export failed: ${e?.message || e}`);
    }
  };

  const exportAepZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const poles = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
      const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
      const effectiveProfile = (()=>{
        const baseName = activeJob?.submissionProfileName || store.currentSubmissionProfile;
        const base = (store.submissionProfiles||[]).find(p=>p.name===baseName) || {};
        return { ...base, ...(activeJob?.submissionProfileOverrides||{}), name: base?.name };
      })();
      const { header, rows, fileLabel } = buildManifest('aep', poles, activeJob);
      zip.file('manifest.csv', csvFrom(header, rows));
      zip.file('job-profile.json', JSON.stringify({ jobId: activeJob?.id || '', jobName: activeJob?.name || '', owner: activeJob?.jobOwner || store.jobOwner || '', commCompany: activeJob?.commCompany || '', submissionProfile: effectiveProfile, includePhotos }, null, 2));
      if (includePhotos) {
        const photos = zip.folder('photos');
        const index = [];
        for (const p of poles) {
          if (!p.photoDataUrl) continue;
          const safeId = p.id ? String(p.id).replaceAll(/[^A-Za-z0-9_-]/g,'_') : `row-${index.length+1}`;
          const dataUrl = String(p.photoDataUrl);
          const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
          const mime = m?.[1] || 'image/jpeg';
          const base64 = m?.[2] || dataUrl.split(',')[1];
          const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
          const file = `${safeId}.${ext}`;
          if (base64) { photos.file(file, base64, { base64: true }); index.push(`${safeId},${file},${mime}`); }
        }
        if (index.length) photos.file('index.csv', ['id,file,mime', ...index].join('\n'));
      }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${fileLabel}.zip`; a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(`ZIP export failed: ${e?.message || e}`);
    }
  };

  const exportByProfile = async () => {
    const job = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    const name = job?.submissionProfileName || store.currentSubmissionProfile;
    if (name === 'firstEnergy') return exportSpansZip();
    if (name === 'aep') return exportAepZip();
    if (name === 'duke') {
      // Use generic rows-by-profile path to build a Duke manifest package
      const scoped = (store.collectedPoles || []).filter(p => !store.currentJobId || p.jobId === store.currentJobId);
      return exportRowsByProfile(scoped, '');
    }
    // default fallback to CSV zip-like minimal package (reuse AEP format)
    return exportAepZip();
  };

  // Derived filtered rows for QA
  const rows = React.useMemo(() => {
    const list = (store.collectedPoles || []).filter(p => !store.currentJobId || p.jobId === store.currentJobId);
    return list.filter(p => {
      if (filterStatus !== 'all' && (p.status || 'draft') !== filterStatus) return false;
      if (filterPhoto === 'with' && !p.photoDataUrl) return false;
      if (filterPhoto === 'without' && !!p.photoDataUrl) return false;
      if (filterPass !== 'all') {
        const verdict = evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile);
        if (filterPass === 'pass' && verdict !== 'PASS') return false;
        if (filterPass === 'fail' && verdict !== 'FAIL') return false;
      }
      return true;
    });
  }, [store.collectedPoles, store.currentJobId, filterStatus, filterPhoto, filterPass, store.presetProfile]);

  const summary = React.useMemo(() => {
    const scoped = (store.collectedPoles || []).filter(p => !store.currentJobId || p.jobId === store.currentJobId);
    const total = scoped.length;
    const done = scoped.filter(p => (p.status || 'draft') === 'done').length;
    const withPhoto = scoped.filter(p => !!p.photoDataUrl).length;
    const pass = scoped.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile) === 'PASS').length;
    const fail = scoped.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile) === 'FAIL').length;
    return { total, done, withPhoto, pass, fail };
  }, [store.collectedPoles, store.currentJobId, store.presetProfile]);

  const exportFilteredByProfile = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    const name = activeJob?.submissionProfileName || store.currentSubmissionProfile;
    const effectiveProfile = (()=>{
      const base = (store.submissionProfiles||[]).find(p=>p.name===name) || {};
      return { ...base, ...(activeJob?.submissionProfileOverrides||{}), name: base?.name };
    })();
    // scope to filtered rows
    const filtered = rows;
    const withVariance = filtered.map(p => ({
      ...p,
      _varianceIn: computeVarianceIn(p.asBuilt?.attachHeight, p.height),
      _variancePass: evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)
    }));
    const { header, rows: manifestRows, fileLabel } = buildManifest(name, withVariance, activeJob);
    zip.file('manifest.csv', csvFrom(header, manifestRows));
    zip.file('job-profile.json', JSON.stringify({ jobId: activeJob?.id || '', jobName: activeJob?.name || '', owner: activeJob?.jobOwner || store.jobOwner || '', commCompany: activeJob?.commCompany || '', submissionProfile: effectiveProfile, includePhotos, filter: { status: filterStatus, photo: filterPhoto, variance: filterPass } }, null, 2));
    if (includePhotos) {
      const photos = zip.folder('photos');
      const index = [];
      for (const p of filtered) {
        if (!p.photoDataUrl) continue;
        const safeId = p.id ? String(p.id).replaceAll(/[^A-Za-z0-9_-]/g,'_') : `row-${index.length+1}`;
        const dataUrl = String(p.photoDataUrl);
        const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
        const mime = m?.[1] || 'image/jpeg';
        const base64 = m?.[2] || dataUrl.split(',')[1];
        const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
        const file = `${safeId}.${ext}`;
        if (base64) { photos.file(file, base64, { base64: true }); index.push(`${safeId},${file},${mime}`); }
      }
      if (index.length) photos.file('index.csv', ['id,file,mime', ...index].join('\n'));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${fileLabel}-filtered.zip`; a.click(); URL.revokeObjectURL(url);
  };

  const exportDoneOnly = async () => {
    const keep = rows.filter(p => (p.status || 'draft') === 'done');
    await exportRowsByProfile(keep, '-done');
  };
  const exportFailOnly = async () => {
    const keep = rows.filter(p => evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile) === 'FAIL');
    await exportRowsByProfile(keep, '-fail');
  };

  // Geospatial exports: GeoJSON, KML, KMZ
  const exportGeo = async (type) => {
  const { buildGeoJSON, exportGeoJSON, exportKML, exportKMZ } = await import('../utils/geodata');
    const job = (store.jobs||[]).find(j=>j.id===store.currentJobId) || {};
    // Prefer collected poles scoped to current job; augment with imported poles for span endpoints
    const jobPoles = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
    const importedPoles = store.importedPoles || [];
    // Merge by id (job poles take precedence)
    const byId = new Map();
    for (const p of importedPoles) if (p?.id) byId.set(String(p.id), p);
    for (const p of jobPoles) if (p?.id) byId.set(String(p.id), p);
    const poles = jobPoles.length ? Array.from(new Set([...
      jobPoles,
      // include imported poles only if they have coordinates and aren't already present by exact ref equality
      ...importedPoles.filter(ip => ip && ip.id && !jobPoles.find(jp => String(jp.id) === String(ip.id)))
    ])) : importedPoles;

    // Spans: if imported spans exist, use them; otherwise fall back to neighbor inference on job poles
    let spans = [];
    if ((store.importedSpans || []).length) {
      spans = (store.importedSpans || []).map((s, idx) => ({
        id: s.id || `S${idx+1}`,
        fromId: s.fromId,
        toId: s.toId,
        length: s.length,
        proposedAttach: s.proposedAttach,
        environment: s.environment,
      }));
    } else {
      // Derive simple neighbor spans from ordered job poles with coordinates
      for (let i = 1; i < jobPoles.length; i++) {
        const prev = jobPoles[i - 1]; const cur = jobPoles[i];
        if (prev?.latitude && prev?.longitude && cur?.latitude && cur?.longitude) {
          spans.push({ id: `${prev.id||i-1}-${cur.id||i}`, fromId: prev.id, toId: cur.id, length: prev.spanDistance||'', proposedAttach: cur.height||'' });
        }
      }
    }

    const fc = buildGeoJSON({ poles, spans, job });
    if (!fc.features.length) return alert('No geolocated poles/spans to export');
    if (type === 'geojson') return exportGeoJSON(fc, `${job.name||'job'}-geodata.geojson`);
    if (type === 'kml') return exportKML(fc, `${job.name||'job'}-geodata.kml`);
    if (type === 'kmz') return exportKMZ(fc, `${job.name||'job'}-geodata.kmz`);
  };
  const exportRowsByProfile = async (subset, suffix) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    const name = activeJob?.submissionProfileName || store.currentSubmissionProfile;
    const effectiveProfile = (()=>{
      const base = (store.submissionProfiles||[]).find(p=>p.name===name) || {};
      return { ...base, ...(activeJob?.submissionProfileOverrides||{}), name: base?.name };
    })();
    const withVariance = subset.map(p => ({
      ...p,
      _varianceIn: computeVarianceIn(p.asBuilt?.attachHeight, p.height),
      _variancePass: evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)
    }));
    const { header, rows: manifestRows, fileLabel } = buildManifest(name, withVariance, activeJob);
    zip.file('manifest.csv', csvFrom(header, manifestRows));
    zip.file('job-profile.json', JSON.stringify({ jobId: activeJob?.id || '', jobName: activeJob?.name || '', owner: activeJob?.jobOwner || store.jobOwner || '', commCompany: activeJob?.commCompany || '', submissionProfile: effectiveProfile, includePhotos, subset: suffix }, null, 2));
    if (includePhotos) {
      const photos = zip.folder('photos');
      const index = [];
      for (const p of subset) {
        if (!p.photoDataUrl) continue;
        const safeId = p.id ? String(p.id).replaceAll(/[^A-Za-z0-9_-]/g,'_') : `row-${index.length+1}`;
        const dataUrl = String(p.photoDataUrl);
        const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
        const mime = m?.[1] || 'image/jpeg';
        const base64 = m?.[2] || dataUrl.split(',')[1];
        const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
        const file = `${safeId}.${ext}`;
        if (base64) { photos.file(file, base64, { base64: true }); index.push(`${safeId},${file},${mime}`); }
      }
      if (index.length) photos.file('index.csv', ['id,file,mime', ...index].join('\n'));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${fileLabel}${suffix}.zip`; a.click(); URL.revokeObjectURL(url);
  };

  // Midspan Verification: show spans for which we have both endpoints and can compute midspan
  const midspanChecks = React.useMemo(() => {
    const scoped = (store.collectedPoles || []).filter(p=>!store.currentJobId || p.jobId===store.currentJobId);
    const byId = new Map(); scoped.forEach(p => { if (p?.id) byId.set(String(p.id), p); });
    // if imported spans exist, use them to determine adjacency; else infer neighbor pairs
    const spans = (store.importedSpans || []).length ? store.importedSpans : scoped.slice(1).map((cur,i)=>({ fromId: scoped[i]?.id, toId: cur.id, id: `${scoped[i]?.id||i}-${cur.id||i+1}`, length: scoped[i]?.spanDistance }));
    const rows = [];
    for (const s of spans) {
      const a = s.fromId ? byId.get(String(s.fromId)) : null;
      const b = s.toId ? byId.get(String(s.toId)) : null;
      if (!a || !b) continue; // need both endpoints collected
      // Use FE-style profile merging used elsewhere
      const activeJob = (store.jobs||[]).find(j=>j.id===store.currentJobId);
      const profileName = activeJob?.submissionProfileName || store.currentSubmissionProfile;
      const baseProfile = (store.submissionProfiles||[]).find(p=>p.name===profileName);
      const mergedProfile = baseProfile ? { ...baseProfile, ...(activeJob?.submissionProfileOverrides||{}) } : undefined;
      const out = computeAnalysis({
        poleHeight: a.height, poleClass: a.poleClass, poleLatitude: a.latitude, poleLongitude: a.longitude,
        adjacentPoleHeight: b.height, adjacentPoleLatitude: b.latitude, adjacentPoleLongitude: b.longitude,
        existingPowerHeight: a.powerHeight, existingPowerVoltage: store.existingPowerVoltage,
        spanDistance: s.length, isNewConstruction: store.isNewConstruction,
        attachmentType: store.attachmentType, cableDiameter: store.cableDiameter, windSpeed: store.windSpeed,
        spanEnvironment: store.spanEnvironment, dripLoopHeight: store.dripLoopHeight,
        proposedLineHeight: a.height, // proposed comm at A row, if present
        existingLines: store.existingLines, iceThicknessIn: store.iceThicknessIn, hasTransformer: a.hasTransformer,
        presetProfile: store.presetProfile, customMinTopSpace: store.customMinTopSpace,
        customRoadClearance: store.customRoadClearance, customCommToPower: store.customCommToPower,
        powerReference: store.powerReference, jobOwner: store.jobOwner,
        submissionProfile: mergedProfile,
        adjacentPowerHeight: b.powerHeight,
      });
      if (out?.results) {
        rows.push({ id: s.id || `${a.id}-${b.id}`, from: a.id, to: b.id, midspanFt: out.results.span.midspanFt, groundTargetFt: out.results.clearances.groundClearance });
      }
    }
    return rows;
  }, [store]);

  return (
    <div className="rounded border p-3 no-print">
      <div className="flex items-center justify-between mb-2">
    <div className="font-medium flex items-center gap-2">
          Field Collection
          <button
            className="text-xs px-2 py-0.5 border rounded text-blue-700 border-blue-300 hover:bg-blue-50"
      onClick={()=> openHelp && openHelp('help-field-collection') }
            title="Open Help to Field Collection"
          >Help</button>
        </div>
  <div className="text-xs text-gray-600">Collected: {summary.total} (Done: {summary.done}, Pass: {summary.pass}, Fail: {summary.fail}, Photos: {summary.withPhoto}) | Max per FE batch: 25 — Hint: set Owner to "Mon Power" (FirstEnergy) when applicable</div>
      </div>
      {/* QA Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Filter Status</span>
          <select className="border rounded px-2 py-1" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Filter Photos</span>
          <select className="border rounded px-2 py-1" value={filterPhoto} onChange={e=>setFilterPhoto(e.target.value)}>
            <option value="all">All</option>
            <option value="with">With Photo</option>
            <option value="without">Without Photo</option>
          </select>
        </label>
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Filter FE Variance</span>
          <select className="border rounded px-2 py-1" value={filterPass} onChange={e=>setFilterPass(e.target.value)}>
            <option value="all">All</option>
            <option value="pass">PASS</option>
            <option value="fail">FAIL</option>
          </select>
        </label>
        <div className="text-xs text-gray-600 flex items-end">Job: {store.currentJobId ? ((store.jobs||[]).find(j=>j.id===store.currentJobId)?.name || '—') : '—'}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input label="Pole ID" value={poleId} onChange={e=>setPoleId(e.target.value)} placeholder="e.g., Tag # or temp" />
        <Input label="Latitude" value={store.poleLatitude} onChange={e=>store.setPoleLatitude(e.target.value)} placeholder="40.123456" />
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <Input label="Longitude" value={store.poleLongitude} onChange={e=>store.setPoleLongitude(e.target.value)} placeholder="-82.987654" />
          <button className="h-9 px-3 border rounded text-sm" onClick={async()=>{
            if (!('geolocation' in navigator)) { alert('Geolocation not supported'); return; }
            try {
              const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
              const { latitude, longitude } = pos.coords || {};
              if (latitude != null && longitude != null) { store.setPoleLatitude(latitude.toFixed(6)); store.setPoleLongitude(longitude.toFixed(6)); }
            } catch (e) { alert(`Failed to get location: ${e?.message || e}`); }
          }}>GPS</button>
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-700">Photo</span>
            <div className="flex items-center gap-2">
              <button className="h-9 px-2 border rounded text-sm" onClick={()=>fileInputRefCamera.current?.click()} title="Take photo">Camera</button>
              <button className="h-9 px-2 border rounded text-sm" onClick={()=>fileInputRefLibrary.current?.click()} title="Choose from library">Library</button>
              {currentPhotoDataUrl ? <img src={currentPhotoDataUrl} alt="preview" className="h-9 w-9 object-cover rounded border" /> : null}
              {currentPhotoDataUrl ? <button className="h-9 px-2 border rounded text-sm" onClick={()=>setCurrentPhotoDataUrl('')}>Remove</button> : null}
              <input ref={fileInputRefCamera} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>onSelectPhoto(e.target.files?.[0])} />
              <input ref={fileInputRefLibrary} type="file" accept="image/*" className="hidden" onChange={e=>onSelectPhoto(e.target.files?.[0])} />
            </div>
          </div>
          <div className="flex items-end justify-end gap-2">
            <button className="h-9 px-3 border rounded text-sm" onClick={onSaveDraft} disabled={saving}>Save Draft</button>
            <button className="h-9 px-3 border rounded text-sm" onClick={onDone} disabled={saving}>DONE</button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs inline-flex items-center gap-2 mr-1">
          <input type="checkbox" className="h-4 w-4" checked={includePhotos} onChange={e=>setIncludePhotos(e.target.checked)} />
          <span>Include photos</span>
        </label>
        <button className="px-2 py-1 border rounded text-sm" onClick={exportCollected} disabled={!store.collectedPoles?.length}>Export CSV</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportFirst25} disabled={(store.collectedPoles?.length||0) < 1}>Export First 25</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportSpansZip} disabled={(store.collectedPoles?.length||0) < 1}>Export FE SPANS ZIP</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={exportByProfile} disabled={(store.collectedPoles?.length||0) < 1}>Export Utility ZIP (Profile)</button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Geospatial:</span>
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>exportGeo('geojson')} disabled={(store.collectedPoles?.length||0) < 1}>GeoJSON</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>exportGeo('kml')} disabled={(store.collectedPoles?.length||0) < 1}>KML</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>exportGeo('kmz')} disabled={(store.collectedPoles?.length||0) < 1}>KMZ</button>
          {/* Shapefile export omitted intentionally to avoid heavy deps */}
        </div>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportAepZip} disabled={(store.collectedPoles?.length||0) < 1}>Export AEP ZIP</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportFilteredByProfile} disabled={!rows.length}>Export Filtered ZIP</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportDoneOnly} disabled={!rows.length}>Export DONE-only</button>
  <button className="px-2 py-1 border rounded text-sm" onClick={exportFailOnly} disabled={!rows.length}>Export FAIL-only</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>store.setCollectedPoles?.([])} disabled={!store.collectedPoles?.length}>Clear</button>
      </div>

  <div className="mt-3 overflow-auto">
        {/* Midspan Verification */}
        {midspanChecks.length ? (
          <div className="mb-3 rounded border p-2">
            <div className="font-medium mb-1">Midspan Verification</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-1">Span</th>
                  <th className="p-1">Midspan</th>
                  <th className="p-1">Target</th>
                  <th className="p-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {midspanChecks.map(row => {
                  const ok = row.midspanFt == null ? false : row.midspanFt >= row.groundTargetFt;
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="p-1">{row.from} → {row.to}</td>
                      <td className="p-1">{row.midspanFt != null ? (store.useTickMarkFormat ? formatFeetInchesTickMarks(row.midspanFt) : formatFeetInchesVerbose(row.midspanFt)) : '—'}</td>
                      <td className="p-1">{store.useTickMarkFormat ? formatFeetInchesTickMarks(row.groundTargetFt) : formatFeetInchesVerbose(row.groundTargetFt)}</td>
                      <td className={ok ? 'p-1 text-emerald-700' : 'p-1 text-red-700'}>{ok ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[11px] text-gray-600 mt-1">Midspan is evaluated only when both poles of the span are collected. Span distance is auto-derived from geolocation when not provided. Make-ready lowering at either end propagates to midspan in the calculation.</div>
          </div>
        ) : null}
        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 text-sm">
          <div className="border rounded p-2"><div className="text-xs text-gray-500">Total</div><div className="text-lg font-semibold">{summary.total}</div></div>
          <div className="border rounded p-2"><div className="text-xs text-gray-500">Done</div><div className="text-lg font-semibold">{summary.done}</div></div>
          <div className="border rounded p-2"><div className="text-xs text-gray-500">Photos</div><div className="text-lg font-semibold">{summary.withPhoto}</div></div>
          <div className="border rounded p-2"><div className="text-xs text-gray-500">PASS</div><div className="text-lg font-semibold text-emerald-700">{summary.pass}</div></div>
          <div className="border rounded p-2"><div className="text-xs text-gray-500">FAIL</div><div className="text-lg font-semibold text-red-700">{summary.fail}</div></div>
        </div>

        <table className="w-full text-sm min-w-[920px]">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">ID</th>
              <th className="p-2">Latitude</th>
              <th className="p-2">Longitude</th>
              <th className="p-2">Height</th>
              <th className="p-2">Class</th>
              <th className="p-2">Power Ht</th>
              <th className="p-2">Voltage</th>
              <th className="p-2">XFMR</th>
              <th className="p-2">Span</th>
      <th className="p-2">As-built Attach</th>
      <th className="p-2">As-built Power</th>
      <th className="p-2">Δ (in)</th>
      <th className="p-2">FE Pass</th>
      <th className="p-2">Photo</th>
      <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={`${p.id}-${i}`} className="border-t">
                <td className="p-2"><input className="border rounded px-2 py-1 w-28" value={p.id || ''} onChange={e=>store.updateCollectedPole(i,{ id: e.target.value })} /></td>
                <td className="p-2">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <input className="border rounded px-2 py-1 w-32" value={p.latitude || ''} onChange={e=>store.updateCollectedPole(i,{ latitude: e.target.value })} />
                    <button className="px-2 py-1 border rounded text-xs" onClick={()=>handleRowGPS(i)}>GPS</button>
                  </div>
                </td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-32" value={p.longitude || ''} onChange={e=>store.updateCollectedPole(i,{ longitude: e.target.value })} /></td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-24" value={p.height || ''} onChange={e=>store.updateCollectedPole(i,{ height: e.target.value })} placeholder="ft/in" /></td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-24" value={p.poleClass || ''} onChange={e=>store.updateCollectedPole(i,{ poleClass: e.target.value })} /></td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-24" value={p.powerHeight || ''} onChange={e=>store.updateCollectedPole(i,{ powerHeight: e.target.value })} placeholder="ft/in" /></td>
                <td className="p-2">
                  <select className="border rounded px-2 py-1" value={p.voltage || 'distribution'} onChange={e=>store.updateCollectedPole(i,{ voltage: e.target.value })}>
                    <option value="distribution">distribution</option>
                    <option value="transmission">transmission</option>
                    <option value="communication">communication</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  <input type="checkbox" className="h-4 w-4" checked={!!p.hasTransformer} onChange={e=>store.updateCollectedPole(i,{ hasTransformer: e.target.checked })} />
                </td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-20" value={p.spanDistance || ''} onChange={e=>store.updateCollectedPole(i,{ spanDistance: e.target.value })} /></td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-28" value={p.asBuilt?.attachHeight || ''} onChange={e=>store.updateCollectedPole(i,{ asBuilt: { ...(p.asBuilt||{}), attachHeight: e.target.value } })} placeholder="ft/in" /></td>
                <td className="p-2"><input className="border rounded px-2 py-1 w-28" value={p.asBuilt?.powerHeight || ''} onChange={e=>store.updateCollectedPole(i,{ asBuilt: { ...(p.asBuilt||{}), powerHeight: e.target.value } })} placeholder="ft/in" /></td>
                <td className="p-2 w-20">{computeVarianceIn(p.asBuilt?.attachHeight, p.height)}</td>
                <td className="p-2 w-24">
                  <span className={evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile) === 'PASS' ? 'text-emerald-700' : 'text-red-700'}>
                    {evaluateVariancePass(p.asBuilt?.attachHeight, p.height, store.presetProfile)}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {p.photoDataUrl ? <img src={p.photoDataUrl} alt="photo" className="h-10 w-10 object-cover rounded border" /> : <span className="text-xs text-gray-500">None</span>}
                    <label className="hidden">
                      <input type="file" accept="image/*" capture="environment" onChange={e=>{
                        const f = e.target.files?.[0]; if (!f) return;
                        const reader = new FileReader(); reader.onload = () => store.updateCollectedPole(i, { photoDataUrl: String(reader.result || '') }); reader.readAsDataURL(f);
                        e.target.value='';
                      }} />
                    </label>
                    <button className="px-2 py-1 border rounded text-xs" onClick={()=>{
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*'; input.setAttribute('capture','environment');
                      input.onchange = (e)=>{
                        const f = e.target?.files?.[0]; if (!f) return;
                        const reader = new FileReader(); reader.onload = () => store.updateCollectedPole(i, { photoDataUrl: String(reader.result || '') }); reader.readAsDataURL(f);
                      };
                      input.click();
                    }}>Camera</button>
                    <button className="px-2 py-1 border rounded text-xs" onClick={()=>{
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = (e)=>{
                        const f = e.target?.files?.[0]; if (!f) return;
                        const reader = new FileReader(); reader.onload = () => store.updateCollectedPole(i, { photoDataUrl: String(reader.result || '') }); reader.readAsDataURL(f);
                      };
                      input.click();
                    }}>Library</button>
                    {p.photoDataUrl ? <button className="px-2 py-1 border rounded text-xs" onClick={()=>store.updateCollectedPole(i, { photoDataUrl: '' })}>Remove</button> : null}
                  </div>
                </td>
                <td className="p-2">
                  <select className="border rounded px-2 py-1" value={p.status || 'draft'} onChange={e=>store.updateCollectedPole(i,{ status: e.target.value })}>
                    <option value="draft">draft</option>
                    <option value="done">done</option>
                  </select>
                </td>
                <td className="p-2 text-right">
                  <button className="text-xs text-red-600" onClick={()=>store.removeCollectedPole(i)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchReport() {
  const store = useAppStore();
  const poleById = React.useMemo(() => {
    const map = new Map();
    for (const p of store.importedPoles || []) if (p?.id) map.set(String(p.id), p);
    return map;
  }, [store.importedPoles]);
  const items = React.useMemo(() => {
    const rows = [];
    for (const s of store.importedSpans || []) {
      const from = s.fromId ? poleById.get(String(s.fromId)) : null;
      const to = s.toId ? poleById.get(String(s.toId)) : null;
      // Auto span length when endpoints available
      const autoLen = (from?.latitude!=null && from?.longitude!=null && to?.latitude!=null && to?.longitude!=null)
        ? Math.round(((() => {
            const toRad = (d) => d * Math.PI / 180;
            const Rm = 6371000;
            const dLat = toRad((Number(to.latitude)||0) - (Number(from.latitude)||0));
            const dLon = toRad((Number(to.longitude)||0) - (Number(from.longitude)||0));
            const a = Math.sin(dLat/2)**2 + Math.cos(toRad(Number(from.latitude)||0))*Math.cos(toRad(Number(to.latitude)||0))*Math.sin(dLon/2)**2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const meters = Rm * c; return meters * 3.28084;
          })())) : undefined;
      const preferAuto = !!store.preferAutoSpanLength;
      const inputs = {
        poleHeight: from?.height || store.poleHeight,
        poleClass: from?.class || store.poleClass,
        existingPowerHeight: from?.powerHeight || store.existingPowerHeight,
        existingPowerVoltage: store.existingPowerVoltage,
  spanDistance: preferAuto ? (autoLen || s.length || store.spanDistance) : (s.length || store.spanDistance || autoLen),
        isNewConstruction: store.isNewConstruction,
        adjacentPoleHeight: to?.height || store.adjacentPoleHeight,
        attachmentType: store.attachmentType,
        cableDiameter: store.cableDiameter,
        windSpeed: store.windSpeed,
        spanEnvironment: store.spanEnvironment,
        streetLightHeight: store.streetLightHeight,
        dripLoopHeight: store.dripLoopHeight,
        proposedLineHeight: s.proposedAttach || store.proposedLineHeight,
        existingLines: store.importedExistingLines?.length ? store.importedExistingLines : store.existingLines,
        iceThicknessIn: store.iceThicknessIn,
        hasTransformer: !!from?.hasTransformer || store.hasTransformer,
        presetProfile: store.presetProfile,
        customMinTopSpace: store.customMinTopSpace,
        customRoadClearance: store.customRoadClearance,
        customCommToPower: store.customCommToPower,
      };
      const out = computeAnalysis({ 
        ...inputs, 
        powerReference: store.powerReference, 
        jobOwner: store.jobOwner,
        submissionProfile: (store.submissionProfiles||[]).find(p=>p.name===store.currentSubmissionProfile)
      });
      if (out?.results) rows.push({ span: s, from, to, ...out });
    }
    return rows;
  }, [store, poleById]);
  if (!items.length) return <div className="text-gray-600">No imported spans to report.</div>;
  return (
    <div className="grid gap-6 text-left">
      {items.map((it, idx) => (
        <div key={idx} className={idx > 0 ? 'page-break' : ''}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Span Report {it.span?.id ? `#${it.span.id}` : `#${idx+1}`}</h2>
              <div className="text-sm text-gray-600">Project: {store.projectName || '—'} | Applicant: {store.applicantName || '—'} | Job #: {store.jobNumber || '—'}</div>
              <div className="text-sm text-gray-600">From: {it.from?.id || '—'} to {it.to?.id || '—'} | Length: {Math.round(it.results.span.spanFt)} ft</div>
            </div>
            <div className="text-right">
              {store.logoDataUrl ? <img src={store.logoDataUrl} alt="Logo" className="h-10 inline-block" /> : <div className="text-2xl font-bold">PolePro</div>}
              <div className="text-xs text-gray-500">Generated {new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div className="mt-2">Attach: {it.results.attach.proposedAttachFmt} | Sag: {it.results.span.sagFmt} | Midspan: {it.results.span.midspanFmt}</div>
          <div className="my-2">
            <SpanDiagram attachFt={it.results.attach.proposedAttachFt} midspanFt={it.results.span.midspanFt} spanFt={it.results.span.spanFt} groundTargetFt={it.results.clearances.groundClearance} />
          </div>
          {it.warnings?.length ? (
            <div className="mt-2">
              <div className="font-medium">Warnings</div>
              <ul className="list-disc pl-5 text-sm">
                {it.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          ): null}
          {it.notes?.length ? (
            <div className="mt-2">
              <div className="font-medium">Notes</div>
              <ul className="list-disc pl-5 text-sm">
                {it.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="mt-2 text-sm text-gray-700">Estimated cost: ${it.cost ?? 0}</div>
        </div>
      ))}
      {/* Optional: pole profile sheets */}
      {store.importedPoles?.length ? (
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-2">Pole Profile Sheets</h2>
          <div className="grid gap-4">
            {store.importedPoles.map((p, i) => (
              <div key={p.id || i} className={i > 0 ? 'page-break' : ''}>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-medium">Pole {p.id || `#${i+1}`}</div>
                    <div className="text-sm text-gray-600">Project: {store.projectName || '—'} | Applicant: {store.applicantName || '—'} | Job #: {store.jobNumber || '—'}</div>
                    <div className="text-sm text-gray-600">Height: {p.height ? `${Math.round(p.height)} ft` : '—'} | Class: {p.class || '—'} | Power Height: {p.powerHeight ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    {store.logoDataUrl ? <img src={store.logoDataUrl} alt="Logo" className="h-10 inline-block" /> : <div className="text-2xl font-bold">PolePro</div>}
                    <div className="text-xs text-gray-500">Generated {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">Transformer: {p.hasTransformer ? 'Yes' : 'No'} | Location: {p.latitude ?? '—'}, {p.longitude ?? '—'}</div>
                {/* Space for photos or diagrams can be added later */}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="no-print">
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>window.print()}>Print Batch</button>
      </div>
    </div>
  );
}

function ImportPanel() {
  const store = useAppStore();
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [mapping, setMapping] = React.useState(MAPPING_PRESETS[0].mapping);
  const [batchPreview, setBatchPreview] = React.useState({ poles: 0, spans: 0, lines: 0 });
  const [csvText, setCsvText] = React.useState('');
  const [showConfig, setShowConfig] = React.useState(false);
  const [showAutoPreview, setShowAutoPreview] = React.useState(false);
  const [autoPreview, setAutoPreview] = React.useState(null);
  const [attrKeys, setAttrKeys] = React.useState({ pole: [], span: [], line: [] });
  const onImport = async () => {
    if (!file) return;
    try {
      setStatus('Parsing…');
      const fc = await importGeospatialFile(file);
      // Gather attribute keys for config modal if needed
      try {
        const parts = splitFeaturesByGeometry(fc);
        const pk = parts.poles[0] ? getAttributeKeys(parts.poles[0]) : [];
        const lk = parts.lines[0] ? getAttributeKeys(parts.lines[0]) : [];
        setAttrKeys({ pole: pk, span: lk, line: lk });
      } catch (error) {
        console.error("Error analyzing feature attributes:", error);
        setAttrKeys({ pole: [], span: [], line: [] });
      }
      setStatus('Mapping…');
      const data = mapGeoJSONToAppData(fc, mapping);
      // Apply first pole/span into form and lines into existingLines list
      if (data.poleTable[0]) {
        const p = data.poleTable[0];
        if (p.height) store.setPoleHeight(String(Math.round(p.height)));
        if (p.class) store.setPoleClass(p.class);
        if (p.powerHeight) store.setExistingPowerHeight(String(p.powerHeight));
        if (p.hasTransformer) store.setHasTransformer(true);
      }
      if (data.spanTable[0]) {
        const s = data.spanTable[0];
        if (s.length) store.setSpanDistance(String(Math.round(s.length)));
        if (s.proposedAttach) store.setProposedLineHeight(String(s.proposedAttach));
      }
      if (data.existingLines?.length) {
        store.setExistingLines(data.existingLines);
      }
      // Save full batch to store for later batch reporting
      store.setImportedPoles(data.poleTable);
      store.setImportedSpans(data.spanTable);
      store.setImportedExistingLines(data.existingLines);
      setBatchPreview({ poles: data.poleTable.length, spans: data.spanTable.length, lines: data.existingLines.length });
      setStatus(`Imported ${data.poleTable.length} poles, ${data.spanTable.length} spans, ${data.existingLines.length} lines.`);
    } catch (e) {
      setStatus(`Import failed: ${e.message || e}`);
    }
  };
  const update = (g,k,v) => setMapping(prev => ({...prev, [g]: { ...prev[g], [k]: v }}));
  return (
    <div className="rounded border p-3 no-print">
      <div className="font-medium mb-2">Import KML/KMZ/Shapefile</div>
      <div className="grid gap-2 md:grid-cols-3">
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">File</span>
          <input type="file" accept=".kml,.kmz,.zip,.shp,.dbf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        </label>
        <button className="self-end h-9 px-3 border rounded" onClick={onImport} disabled={!file}>Import</button>
        <div className="self-end text-sm text-gray-600">{status}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Mapping Preset</span>
          <select className="border rounded px-2 py-1" value={store.mappingPreset} onChange={(e)=>{
            store.setMappingPreset(e.target.value);
            const preset = MAPPING_PRESETS.find(p=>p.value===e.target.value);
            if (preset) setMapping(preset.mapping);
          }}>
            {MAPPING_PRESETS.map(p=> <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <div className="text-sm text-gray-600 flex items-end">Batch: {batchPreview.poles} poles, {batchPreview.spans} spans, {batchPreview.lines} lines loaded</div>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>{
          // Apply imported first records again (handy after edits)
          const data = { poleTable: store.importedPoles, spanTable: store.importedSpans, existingLines: store.importedExistingLines };
          if (data.poleTable[0]) {
            const p = data.poleTable[0];
            if (p.height) store.setPoleHeight(String(Math.round(p.height)));
            if (p.class) store.setPoleClass(p.class);
            if (p.powerHeight) store.setExistingPowerHeight(String(p.powerHeight));
            store.setHasTransformer(!!p.hasTransformer);
          }
          if (data.spanTable[0]) {
            const s = data.spanTable[0];
            if (s.length) store.setSpanDistance(String(Math.round(s.length)));
            if (s.proposedAttach) store.setProposedLineHeight(String(s.proposedAttach));
          }
          if (data.existingLines?.length) store.setExistingLines(data.existingLines);
        }} disabled={!batchPreview.poles && !batchPreview.spans}>Apply First Record</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <label className="text-sm text-gray-700 grid gap-1">
          <span className="font-medium">Saved Profile</span>
          <select className="border rounded px-2 py-1" onChange={(e)=>{
            const prof = (store.mappingProfiles || []).find(p => p.name === e.target.value);
            if (prof) setMapping(prof.mapping);
          }}>
            <option value="">Select…</option>
            {(store.mappingProfiles || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </label>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>setShowConfig(true)}>Configure Mapping</button>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>{
          const name = prompt('Delete saved profile by name:');
          if (name) store.removeMappingProfile(name);
        }}>Delete Profile</button>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>{
          const oldName = prompt('Rename which profile? Enter existing name:');
          if (!oldName) return;
          const newName = prompt('New name:');
          if (!newName) return;
          store.renameMappingProfile(oldName, newName);
        }}>Rename Profile</button>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>{
          // Simple auto-map heuristic with preview
          const choose = (list, keywords) => (list || []).find(k => keywords.some(w => k.toLowerCase().includes(w))) || '';
          const proposal = {
            pole: {
              ...mapping.pole,
              id: choose(attrKeys.pole, ['id','pole']),
              height: choose(attrKeys.pole, ['height','hgt','ht']),
              class: choose(attrKeys.pole, ['class']),
              powerHeight: choose(attrKeys.pole, ['power','primary','pwr']),
              hasTransformer: choose(attrKeys.pole, ['xfmr','transformer'])
            },
            span: {
              ...mapping.span,
              id: choose(attrKeys.span, ['id','span']),
              fromId: choose(attrKeys.span, ['from','a','start']),
              toId: choose(attrKeys.span, ['to','b','end']),
              length: choose(attrKeys.span, ['length','len','span']),
              proposedAttach: choose(attrKeys.span, ['attach','proposed'])
            },
            line: {
              ...mapping.line,
              type: choose(attrKeys.line, ['type','line']),
              height: choose(attrKeys.line, ['height','hgt','ht']),
              company: choose(attrKeys.line, ['comp','company','owner']),
              makeReady: choose(attrKeys.line, ['mr','make']),
              makeReadyHeight: choose(attrKeys.line, ['mr_h','new','mrh'])
            }
          };
          setAutoPreview(proposal);
          setShowAutoPreview(true);
        }}>Auto-map</button>
        <button className="self-end h-9 px-3 border rounded" onClick={()=>{
          try {
            const blob = new Blob([JSON.stringify(store.mappingProfiles || [], null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'mapping-profiles.json'; a.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error("Failed to export mapping profiles:", error);
          }
        }}>Export Profiles</button>
        <label className="self-end h-9 px-3 border rounded inline-flex items-center gap-2 cursor-pointer">
          <span>Import Profiles</span>
          <input type="file" accept="application/json" className="hidden" onChange={async (e)=>{
            const f = e.target.files?.[0]; if (!f) return;
            try {
              const text = await f.text();
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed)) store.setMappingProfiles(parsed);
            } catch (error) {
              console.error("Failed to import mapping profiles:", error);
            }
            e.target.value = '';
          }} />
        </label>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-gray-700">Mapping (attributes → fields)</summary>
        <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
          {Object.entries(mapping).map(([group, fields]) => (
            <div key={group} className="border rounded p-2">
              <div className="font-medium mb-1">{group}</div>
              {Object.entries(fields).map(([k, v]) => (
                <label key={k} className="grid gap-1 mb-1">
                  <span className="text-xs uppercase text-gray-500">{k}</span>
                  <input className="border rounded px-2 py-1" value={v} onChange={e=>update(group,k,e.target.value)} />
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-gray-700">Import Existing Lines from CSV</summary>
        <div className="grid gap-2 mt-2">
          <textarea className="border rounded p-2 text-xs h-28" placeholder="Paste CSV with headers: type,height,company,makeReady,makeReadyHeight" value={csvText} onChange={(e)=>setCsvText(e.target.value)} />
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded text-sm" onClick={()=>{
              const rows = parseExistingLinesCSV(csvText, mapping.line);
              if (rows.length) store.setExistingLines(rows);
            }}>Use CSV</button>
            <div className="text-xs text-gray-600">This replaces the Existing Lines table</div>
          </div>
        </div>
      </details>
      <MappingConfigModal
        open={showConfig}
        onClose={()=>setShowConfig(false)}
        mapping={mapping}
        onChange={setMapping}
        attrKeys={attrKeys}
        onSave={(name, map)=>{ store.addMappingProfile(name, map); setShowConfig(false); }}
      />
      <AutoMapPreviewModal
        open={showAutoPreview}
        onClose={()=>setShowAutoPreview(false)}
        current={mapping}
        proposal={autoPreview}
        onApply={()=>{ if (autoPreview) setMapping(autoPreview); setShowAutoPreview(false); }}
      />
    </div>
  );
}

function MappingConfigModal({ open, onClose, mapping, onChange, attrKeys, onSave }) {
  const [name, setName] = React.useState('');
  
  if (!open) return null;
  
  const groups = ['pole','span','line'];
  const setField = (g, k, v) => onChange(prev => ({ ...prev, [g]: { ...prev[g], [k]: v } }));
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[90vw] max-w-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Configure Mapping</div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="text-xs text-gray-600 mb-3">Click a detected attribute on the right to fill a field.</div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {groups.map(g => (
            <div key={g} className="border rounded p-2">
              <div className="font-medium mb-1">{g}</div>
              {Object.entries(mapping[g] || {}).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-1 items-center mb-1">
                  <div className="text-xs uppercase text-gray-500">{k}</div>
                  <div className="flex items-center gap-1">
                    <input className="border rounded px-2 py-1 w-full" value={v}
                      onChange={e=>setField(g,k,e.target.value)} />
                    <div className="flex flex-wrap gap-1">
                      {(attrKeys[g] || []).slice(0,6).map(a => (
                        <button key={a} className="text-[10px] px-1 py-0.5 border rounded" onClick={()=>setField(g,k,a)}>{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input className="border rounded px-2 py-1 text-sm" placeholder="Save as profile name" value={name} onChange={e=>setName(e.target.value)} />
          <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ if (name) onSave(name, mapping); }}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}
function LogoUpload() {
  const { setLogoDataUrl } = useAppStore();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <label className="text-sm text-gray-700 grid gap-1">
      <span className="font-medium">Logo</span>
      <input type="file" accept="image/*" className="border rounded px-2 py-1" onChange={onFile} />
    </label>
  );
}

function HelpModal({ open, onClose, initialSection }) {
  React.useEffect(() => {
    if (!open || !initialSection) return;
    // defer to allow modal render
    const t = setTimeout(() => {
      const el = document.getElementById(initialSection);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => clearTimeout(t);
  }, [open, initialSection]);
  if (!open) return null;
  
  const downloadSampleCSV = () => {
    const sampleCSV = `Project Name,Pole Height,Pole Class,Existing Power Height,Span Distance,Wind Speed
Sample Project 1,35ft,Class 4,30' 6",150,90
Sample Project 2,40',Class 3,32ft 0in,200,85
Sample Project 3,45ft,Class 2,35' 6",175,95`;
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-pole-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleKML = () => {
    const sampleKML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sample Pole Data</name>
    <Placemark>
      <name>Pole 1</name>
      <ExtendedData>
        <Data name="height"><value>35ft</value></Data>
        <Data name="class"><value>Class 4</value></Data>
        <Data name="power_ht"><value>30' 6"</value></Data>
      </ExtendedData>
      <Point><coordinates>-82.5,40.0,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>`;
    const blob = new Blob([sampleKML], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-poles.kml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Application Use Directions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Quick Start */}
          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">🚀 Quick Start Guide</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Create/Select a Job:</strong> Use the Job Setup panel to create a job (name, applicant, job #, preset, Owner). Select it to make it active.</li>
                <li><strong>Enter Basic Data:</strong> Project name, pole height, and existing conditions</li>
                <li><strong>Select Construction Type:</strong> New construction or existing pole attachment</li>
                <li><strong>Add Span Information:</strong> Distance, adjacent pole height, wind conditions</li>
                <li><strong>Use GPS (optional):</strong> Tap “GPS” beside Latitude/Longitude to autofill device coordinates</li>
                <li><strong>Configure Existing Lines:</strong> Add communication and power lines on the pole</li>
                <li><strong>Field Collection (mobile):</strong> For each pole, set ID, tap GPS, attach a photo (Camera/Library), then <em>Save Draft</em> or <em>DONE</em></li>
                <li><strong>Review Results:</strong> Check clearances, make-ready requirements, and cost estimates</li>
                <li><strong>Export:</strong> Use Export CSV, or for utility batches use “Export First 25”</li>
              </ol>
            </div>
          </section>
          {/* Jobs/Setup */}
          <section>
            <h3 className="text-lg font-semibold text-sky-700 mb-3">🗂️ Jobs & Setup</h3>
            <div className="bg-sky-50 p-4 rounded-lg text-sm space-y-3">
              <p><strong>Jobs</strong> let you group multiple poles under the same project metadata (name, applicant, job #, preset, notes).</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Create:</strong> Use Job Setup to add a job and it becomes the active job.</li>
                <li><strong>Select:</strong> Use the header dropdown to switch active jobs anytime.</li>
                <li><strong>Auto-link:</strong> Collected poles are tagged to the active job.</li>
                <li><strong>Exports:</strong> Collected CSV exports are filtered to the active job when one is selected.</li>
                <li><strong>Owner default:</strong> Set an Owner (e.g., Mon Power). FE subsidiaries activate 44" comm-to-power rules automatically.</li>
              </ul>
            </div>
          </section>

          {/* Field Collection how-to */}
          <section id="help-field-collection">
            <h3 className="text-lg font-semibold text-emerald-700 mb-3">📍 Field Collection (Mobile + GPS + Photos)</h3>
            <div className="bg-emerald-50 p-4 rounded-lg text-sm space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Collect a pole</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter <strong>Pole ID</strong> (tag or temporary ID)</li>
                  <li>Tap <strong>GPS</strong> to capture <em>Latitude/Longitude</em> from your device</li>
                  <li>Attach a <strong>Photo</strong> using <em>Camera</em> (prompts for permission) or <em>Library</em></li>
                  <li>Tap <strong>Save Draft</strong> to keep editing later, or <strong>DONE</strong> to finalize the entry</li>
                </ol>
              </div>
        <div>
                <h4 className="font-medium text-gray-800 mb-1">Manage collected poles</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Edit inline:</strong> ID, GPS, heights, voltage, transformer, span</li>
                  <li><strong>Per-row GPS:</strong> Use the row <em>GPS</em> button to refresh coordinates on that row</li>
                  <li><strong>Status:</strong> Switch between <em>draft</em> and <em>done</em> per row</li>
          <li><strong>QA Filters:</strong> Use Status/Photos/PASS-FAIL filters and the dashboard counters to speed up review</li>
                  <li><strong>Photos:</strong> Add/replace via <em>Camera</em> or <em>Library</em>; preview and <em>Remove</em> supported</li>
                  <li><strong>Persistence:</strong> Entries are cached in your browser and survive refreshes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Export & utility batches</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Export CSV:</strong> Full table including <em>status</em> and <em>hasPhoto</em> columns</li>
                  <li><strong>Export First 25:</strong> Creates a CSV of the first 25 rows for utilities like FirstEnergy</li>
                  <li><strong>Note:</strong> Photos aren’t embedded in the CSV; only a <em>hasPhoto</em> flag is included</li>
                </ul>
              </div>
              <div className="text-xs text-gray-600">
                <p><strong>Privacy & Permissions:</strong> GPS and camera access are requested by your browser. Data stays on your device unless you export or share it.</p>
              </div>
            </div>
          </section>

          {/* Input Parameters */}
          <section>
            <h3 className="text-lg font-semibold text-green-700 mb-3">📊 Input Parameters Explained</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Pole Information</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Pole Height:</strong> Total height of the pole in feet. For new construction, this determines burial depth (typically 10% + 2ft minimum) and above-ground height available for attachments.</p>
                  <p><strong>Pole Class:</strong> Wood pole classification (Class 1-6) indicating load capacity. Class 1 = highest capacity (~3800 lbf), Class 6 = lowest (~1200 lbf).</p>
                  <p><strong>Construction Type:</strong> 'New' for virgin poles, 'Existing' for adding to poles with existing infrastructure.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Power System</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Power Voltage:</strong> 'Distribution' (4-35kV), 'Transmission' (&gt;35kV), or 'Communication' for comm-only poles.</p>
                  <p><strong>Existing Power Height:</strong> Height of the lowest power conductor. Critical for NESC clearance calculations.</p>
                  <p><strong>Transformer Present:</strong> Indicates additional equipment complexity and potential clearance issues.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Span Configuration</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Span Distance:</strong> Horizontal distance to adjacent pole. Affects sag calculations and guy requirements.</p>
                  <p><strong>Adjacent Pole Height:</strong> Height of the far-end pole. Used for midspan clearance calculations.</p>
                  <p><strong>Wind Speed:</strong> Design wind speed (typically 60-110 mph). Higher winds increase loading and sag.</p>
                  <p><strong>Ice Thickness:</strong> Ice loading in inches. Increases conductor weight and wind profile.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Cable & Environment</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Cable Type:</strong> Predefined cable characteristics (weight, tension, diameter) affecting sag calculations.</p>
                  <p><strong>Environment:</strong> 'Road' (higher clearances), 'Residential', or 'Pedestrian' areas affect NESC requirements.</p>
                  <p><strong>Proposed Line Height:</strong> Target attachment height for your new communication line.</p>
                </div>
              </div>
            </div>
          </section>

          {/* NESC & Regulatory */}
          <section>
            <h3 className="text-lg font-semibold text-red-700 mb-3">⚖️ NESC & Regulatory Standards</h3>
            <div className="bg-red-50 p-4 rounded-lg text-sm space-y-3">
              <p><strong>National Electrical Safety Code (NESC):</strong> The application implements NESC Table 232-1 clearance requirements for different voltage classes and environments.</p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h5 className="font-medium">Ground Clearances (NESC)</h5>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Communication over roads: 15.5 ft minimum</li>
                    <li>Communication over pedestrian areas: 9.5 ft minimum</li>
                    <li>Distribution power over roads: 23 ft minimum</li>
                    <li>Transmission power over roads: 28.5 ft minimum</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium">Vertical Separations</h5>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Communication to power (distribution): 40 inches</li>
                    <li>Communication to power (transmission): 6 feet</li>
                    <li>Communication to communication: 12 inches</li>
                    <li>Minimum pole top space: 12 inches</li>
                  </ul>
                </div>
              </div>
              
              <p><strong>FirstEnergy Specific:</strong> When "FirstEnergy" preset is selected, additional utility-specific requirements are applied including 18 ft road clearance and specific attachment procedures.</p>
            </div>
          </section>

          {/* Calculations */}
          <section>
            <h3 className="text-lg font-semibold text-purple-700 mb-3">🧮 Calculation References</h3>
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Sag Calculation</h4>
                <p><strong>Formula:</strong> Sag = (w × L²) / (8 × T)</p>
                <p><strong>Where:</strong> w = effective weight per foot (including wind loading), L = span length, T = cable tension</p>
                <p><strong>Wind Loading:</strong> Calculated using q = 0.00256 × V² (where V = wind speed in mph)</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Midspan Height</h4>
                <p><strong>Formula:</strong> Midspan = ((Attach Height A + Attach Height B) / 2) - Sag</p>
                <p><strong>Critical Check:</strong> Midspan height must exceed ground clearance requirements</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Guy Wire Analysis</h4>
                <p><strong>Tension Calculation:</strong> Based on horizontal loading from cable tension and wind forces</p>
                <p><strong>Geometry:</strong> Guy angle typically 30-60°, lead distance = guy height × 0.5</p>
                <p><strong>Threshold:</strong> Guy recommended when tension exceeds 500 lbf</p>
              </div>
            </div>
          </section>

          {/* Data Input Guide */}
          <section>
            <h3 className="text-lg font-semibold text-orange-700 mb-3">📝 Data Input Guidelines</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Height Format Support</h4>
                <div className="bg-orange-50 p-3 rounded text-sm">
                  <p><strong>Tick Mark Format:</strong> 35' (feet), 6" (inches), 35'6" (feet and inches)</p>
                  <p><strong>Verbose Format:</strong> 35ft (feet), 6in (inches), 35ft 6in (feet and inches)</p>
                  <p><strong>Decimal Support:</strong> 35.5' or 35.5ft for half-foot measurements</p>
                  <p className="text-orange-700 font-medium mt-2">Use the "Display Format" dropdown to choose your preferred format throughout the application.</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Existing Lines Data Table</h4>
                <div className="bg-orange-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Line Type:</strong> Select from Communication, Drop (Comm), Neutral, or Power Secondary</p>
                  <p><strong>Height:</strong> Current attachment height of the existing line</p>
                  <p><strong>Company:</strong> Owning utility or service provider (for cost allocation)</p>
                  <p><strong>Make Ready:</strong> Check if line needs to be moved to accommodate new attachment</p>
                  <p><strong>New Height:</strong> Target height after make-ready work (if applicable)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Import/Export */}
          <section>
            <h3 className="text-lg font-semibold text-teal-700 mb-3">📁 Import/Export Features</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Supported Import Formats</h4>
                <div className="bg-teal-50 p-3 rounded text-sm space-y-2">
                  <p><strong>KML/KMZ:</strong> Google Earth files with pole location and attribute data</p>
                  <p><strong>Shapefile:</strong> GIS data (.zip with .shp, .dbf, .shx files)</p>
                  <p><strong>CSV:</strong> Comma-separated values for existing lines data</p>
                </div>
                
                <div className="mt-3 space-x-2">
                  <button onClick={downloadSampleKML} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">
                    Download Sample KML
                  </button>
                  <button onClick={downloadSampleCSV} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">
                    Download Sample CSV
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Export Options</h4>
                <div className="bg-teal-50 p-3 rounded text-sm space-y-2">
                  <p><strong>CSV Export:</strong> Analysis results in spreadsheet format with your preferred height formatting</p>
                  <p><strong>PDF Report:</strong> Professional printable report with project details, calculations, and diagrams</p>
                  <p><strong>Batch Report:</strong> Multiple pole analysis when importing geospatial data</p>
                  <p><strong>FirstEnergy SPANS ZIP:</strong> Job-scoped package with manifest.csv and photos/ suitable for SPANS submissions (max 25 per application recommended)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cost Analysis */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-700 mb-3">💰 Cost Analysis</h3>
            <div className="bg-indigo-50 p-4 rounded-lg text-sm space-y-2">
              <p><strong>Base Construction Cost:</strong> $150 for new construction, $200 for existing pole attachment</p>
              <p><strong>Make-Ready Cost:</strong> $12.50 per inch of vertical adjustment required</p>
              <p><strong>Guy Wire Cost:</strong> $350 base + tension-based scaling (up to $1000 for high-load conditions)</p>
              <p><strong>Transformer Complexity:</strong> $300 additional for poles with transformers</p>
              <p><strong>Special Engineering:</strong> $500 additional for spans exceeding 300 feet</p>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🔧 Common Issues & Troubleshooting</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>Warning: "CRITICAL: midspan clearance"</strong></p>
                <p>Solution: Increase pole height, reduce span length, or move attachment point higher</p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>"Pole clearance" violations</strong></p>
                <p>Solution: Adjust proposed line height or enable make-ready for conflicting lines</p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>Guy wire required</strong></p>
                <p>Solution: Normal for long spans or high winds. Consider reducing span or increasing pole class</p>
              </div>
            </div>
          </section>

          <div className="bg-blue-100 p-4 rounded-lg text-sm">
            <p className="font-medium text-blue-800">💡 Pro Tip:</p>
            <p>Use the scenario A/B feature to compare different pole heights or configurations. Save your mapping profiles when working with consistent data sources to speed up future imports.</p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Close Help
          </button>
        </div>
      </div>
    </div>
  );
}