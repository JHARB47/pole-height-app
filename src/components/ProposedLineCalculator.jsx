import React, { useEffect } from 'react';
import useAppStore from '../utils/store';
import { DEFAULTS, parseFeet, formatFeetInches, formatFeetInchesTickMarks, formatFeetInchesVerbose, resultsToCSV, computeAnalysis } from '../utils/calculations';
import ExistingLinesEditor from './ExistingLinesEditor';
import SpanDiagram from './SpanDiagram';
import { importGeospatialFile, mapGeoJSONToAppData, MAPPING_PRESETS, parseExistingLinesCSV, getAttributeKeys, splitFeaturesByGeometry } from '../utils/importers';

export default function ProposedLineCalculator() {
  const {
    poleHeight,
    poleClass,
    setPoleHeight,
    setPoleClass,
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
  poleLatitude,
  setPoleLatitude,
  poleLongitude,
  setPoleLongitude,
  } = useAppStore();
  const [showReport, setShowReport] = React.useState(false);
  const [showBatchReport, setShowBatchReport] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  // Make-ready notes & estimate
  useEffect(() => {
    const notes = existingLines
      .filter(line => line.makeReady && line.makeReadyHeight && line.height)
      .map(line => {
        const fmt = (val) => formatFeetInches(parseFeet(val));
        const heightDiffInches = (parseFeet(line.makeReadyHeight) - parseFeet(line.height)) * 12;
        const cost = Math.abs(Math.round(heightDiffInches)) * 12.5;
        return `LWR (${line.companyName || line.type}) FROM ${fmt(line.height)} TO ${fmt(line.makeReadyHeight)} - Est. Cost: $${cost}`;
      });
    setMakeReadyNotes(notes.join('\n'));
  }, [existingLines, setMakeReadyNotes]);

  // Main calculation effect (now driven by pure computeAnalysis)
  useEffect(() => {
    const { results, warnings, notes, cost, errors } = computeAnalysis({
      poleHeight, poleClass, poleLatitude, poleLongitude, existingPowerHeight, existingPowerVoltage,
      spanDistance, isNewConstruction, adjacentPoleHeight,
      attachmentType, cableDiameter, windSpeed, spanEnvironment,
      streetLightHeight, dripLoopHeight, proposedLineHeight,
      existingLines, iceThicknessIn, hasTransformer, presetProfile,
      customMinTopSpace, customRoadClearance, customCommToPower,
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
    customMinTopSpace, customRoadClearance, customCommToPower,
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
        <h1 className="text-lg md:text-xl font-semibold">Pole Plan Wizard</h1>
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
         <Input label="Pole Height (ft)" value={poleHeight} onChange={e=>setPoleHeight(e.target.value)} />
         <Input label="Pole Class" value={poleClass} onChange={e=>setPoleClass(e.target.value)} placeholder="e.g., Class 4" />
         <Select label="Construction" value={isNewConstruction ? 'new' : 'existing'} onChange={e=>setIsNewConstruction(e.target.value === 'new')} options={[{label:'New',value:'new'},{label:'Existing',value:'existing'}]} />
         <Select label="Power Voltage" value={existingPowerVoltage} onChange={e=>setExistingPowerVoltage(e.target.value)} options={[{label:'Distribution',value:'distribution'},{label:'Transmission',value:'transmission'},{label:'Communication',value:'communication'}]} />
         <Input label="Existing Power Height (ft/in)" value={existingPowerHeight} onChange={e=>setExistingPowerHeight(e.target.value)} />
         <Checkbox label="Transformer present" checked={!!hasTransformer} onChange={e=>setHasTransformer(e.target.checked)} />
         <Input label="Street Light Height (ft/in)" value={streetLightHeight} onChange={e=>setStreetLightHeight(e.target.value)} />
         <Input label="Drip Loop Height (ft/in)" value={dripLoopHeight} onChange={e=>setDripLoopHeight(e.target.value)} />
         <Input label="Span (ft)" value={spanDistance} onChange={e=>setSpanDistance(e.target.value)} />
         <Input label="Adjacent Pole (ft)" value={adjacentPoleHeight} onChange={e=>setAdjacentPoleHeight(e.target.value)} />
         <Select label="Cable" value={attachmentType} onChange={e=>setAttachmentType(e.target.value)} options={DEFAULTS.cableTypes.map(c=>({label:c.label,value:c.value}))} />
         <Input label="Cable Diameter (in)" value={cableDiameter} onChange={e=>setCableDiameter(e.target.value)} placeholder="auto from cable" />
         <Input label="Wind (mph)" value={windSpeed} onChange={e=>setWindSpeed(e.target.value)} />
         <Input label="Ice (in)" value={iceThicknessIn} onChange={e=>setIceThicknessIn(e.target.value)} />
         <Select label="Environment" value={spanEnvironment} onChange={e=>setSpanEnvironment(e.target.value)} options={[{label:'Road',value:'road'},{label:'Residential',value:'residential'},{label:'Pedestrian',value:'pedestrian'}]} />
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
          <ExistingLinesEditor />
          <FieldCollection />
        </>
      )}

  <div className="flex flex-col sm:flex-row sm:items-center gap-2 no-print">
        <ScenarioButtons />
        <ExportButtons />
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setShowBatchReport(false); setShowReport(r=>!r); }}>{showReport ? 'Back to Editor' : 'View Report'}</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setShowReport(false); setShowBatchReport(b=>!b); }} disabled={!useAppStore.getState().importedSpans.length}>{showBatchReport ? 'Back to Editor' : 'Batch Report'}</button>
      </div>

      {showReport ? <PrintableReport /> : showBatchReport ? <BatchReport /> : <ResultsPanel />}
      
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
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
    </div>
  );
}

function FieldCollection() {
  const store = useAppStore();
  const [poleId, setPoleId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [currentPhotoDataUrl, setCurrentPhotoDataUrl] = React.useState('');
  const fileInputRefLibrary = React.useRef(null);
  const fileInputRefCamera = React.useRef(null);

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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
      reader.onload = () => setCurrentPhotoDataUrl(String(reader.result || ''));
      reader.readAsDataURL(file);
    } catch (e) {
      // log only in dev to avoid noisy console in prod
      if (import.meta?.env?.DEV) console.warn('Photo selection failed', e);
    }
  };

  const exportCollected = () => {
    const header = ['id','latitude','longitude','height','class','powerHeight','voltage','hasTransformer','spanDistance','adjacentPoleHeight','attachmentType','status','hasPhoto','timestamp'];
    const rows = (store.collectedPoles || []).map(p => [
      p.id || '', p.latitude || '', p.longitude || '', p.height || '', p.poleClass || '', p.powerHeight || '', p.voltage || '', p.hasTransformer ? 'Y' : 'N', p.spanDistance || '', p.adjacentPoleHeight || '', p.attachmentType || '', (p.status || 'draft'), (p.photoDataUrl ? 'Y' : 'N'), p.timestamp || ''
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collected-poles.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportFirst25 = () => {
    const subset = (store.collectedPoles || []).slice(0, 25);
    const header = ['id','latitude','longitude','height','class','powerHeight','voltage','hasTransformer','spanDistance','adjacentPoleHeight','attachmentType','status','hasPhoto','timestamp'];
    const rows = subset.map(p => [
      p.id || '', p.latitude || '', p.longitude || '', p.height || '', p.poleClass || '', p.powerHeight || '', p.voltage || '', p.hasTransformer ? 'Y' : 'N', p.spanDistance || '', p.adjacentPoleHeight || '', p.attachmentType || '', (p.status || 'draft'), (p.photoDataUrl ? 'Y' : 'N'), p.timestamp || ''
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collected-poles-first-25.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded border p-3 no-print">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Field Collection</div>
        <div className="text-xs text-gray-600">Collected: {(store.collectedPoles || []).length} | Max per FE batch: 25</div>
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
        <button className="px-2 py-1 border rounded text-sm" onClick={exportCollected} disabled={!store.collectedPoles?.length}>Export CSV</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={exportFirst25} disabled={(store.collectedPoles?.length||0) < 1}>Export First 25</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>store.setCollectedPoles?.([])} disabled={!store.collectedPoles?.length}>Clear</button>
      </div>

  <div className="mt-3 overflow-auto">
        <table className="w-full text-sm min-w-[720px]">
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
      <th className="p-2">Photo</th>
      <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(store.collectedPoles || []).map((p, i) => (
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
      const inputs = {
        poleHeight: from?.height || store.poleHeight,
        poleClass: from?.class || store.poleClass,
        existingPowerHeight: from?.powerHeight || store.existingPowerHeight,
        existingPowerVoltage: store.existingPowerVoltage,
        spanDistance: s.length || store.spanDistance,
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
      const out = computeAnalysis(inputs);
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

function HelpModal({ open, onClose }) {
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

          {/* Field Collection how-to */}
          <section>
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