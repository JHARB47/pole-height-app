import React from 'react';
import useAppStore from '../utils/store';
import { computeAnalysis, formatFeetInches } from '../utils/calculations';
import { controllingGroundTarget } from '../utils/targets';

export default function SpansEditor() {
  const store = useAppStore();
  const spans = store.importedSpans || [];
  if (!spans.length) return null;

  const onEnvChange = (idx, val) => {
    store.updateImportedSpan(idx, { environment: val });
  };


  const getEffectiveProfile = () => {
    const job = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    const name = job?.submissionProfileName || store.currentSubmissionProfile;
    const base = (store.submissionProfiles||[]).find(p=>p.name===name) || {};
    return { ...base, ...(job?.submissionProfileOverrides||{}) };
  };

  const controllingTargetFromSegments = (segments, fallbackEnv) => controllingGroundTarget(getEffectiveProfile(), segments, fallbackEnv);

  const runCalc = (idx) => {
    const s = spans[idx];
    const a = computeAnalysis({
      poleHeight: store.poleHeight || 35,
      existingPowerHeight: store.existingPowerHeight || '',
      existingPowerVoltage: store.existingPowerVoltage || 'distribution',
      spanDistance: s.lengthFt || s.estimatedLengthFt || 0,
      isNewConstruction: store.isNewConstruction,
      adjacentPoleHeight: store.adjacentPoleHeight || store.poleHeight || 35,
      attachmentType: store.attachmentType,
      cableDiameter: store.cableDiameter,
      windSpeed: store.windSpeed,
      spanEnvironment: s.environment || store.spanEnvironment,
      dripLoopHeight: store.dripLoopHeight,
      proposedLineHeight: store.proposedLineHeight,
      existingLines: store.existingLines,
      iceThicknessIn: store.iceThicknessIn,
      hasTransformer: store.hasTransformer,
      presetProfile: store.presetProfile,
      customMinTopSpace: store.customMinTopSpace,
      customRoadClearance: store.customRoadClearance,
      customCommToPower: store.customCommToPower,
      powerReference: store.powerReference,
      jobOwner: store.jobOwner,
      submissionProfile: getEffectiveProfile(),
    });
    if (a?.results) {
      const controllingTargetFt = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment);
      store.addCachedMidspan({
        spanId: s.id || `${idx+1}`,
        environment: s.environment || store.spanEnvironment,
        spanFt: a.results.span.spanFt,
        midspanFt: a.results.span.midspanFt,
        targetFt: controllingTargetFt ?? a.results.clearances.groundClearance,
        attachFt: a.results.attach.proposedAttachFt,
        segments: Array.isArray(s.segments) ? s.segments : null,
      });
    }
  };

  const saveOnly = (idx) => {
    const s = spans[idx];
    store.addCachedMidspan({
      spanId: s.id || `${idx+1}`,
      environment: s.environment || store.spanEnvironment,
      spanFt: s.lengthFt || s.estimatedLengthFt || 0,
      midspanFt: null,
      targetFt: controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment) ?? null,
      attachFt: null,
      segments: Array.isArray(s.segments) ? s.segments : null,
    });
  };

  return (
    <div className="rounded border p-3 no-print">
      <div className="font-medium mb-2">Spans (Per‑span Environment & Quick Calc)</div>
      <div className="mb-2 flex gap-2">
        {!!(store.cachedMidspans||[]).length && (
          <button
            className="px-2 py-0.5 border rounded text-sm"
            onClick={() => {
              const rows = [['spanId','environment','spanFt','midspanFt','targetFt','attachFt','segments']];
              for (const m of (store.cachedMidspans||[])) {
                rows.push([
                  m.spanId ?? '',
                  m.environment ?? '',
                  m.spanFt ?? '',
                  m.midspanFt ?? '',
                  m.targetFt ?? '',
                  m.attachFt ?? '',
                  Array.isArray(m.segments) ? m.segments.map(x=>`${x.env}:${x.portion || ''}`).join('|') : '',
                ]);
              }
              const csv = rows.map(r => r.map(v => String(v).replaceAll('"','""')).map(v => v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'cached_midspans.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >Export Cached Midspans (CSV)</button>
        )}
        {!!(store.cachedMidspans||[]).length && (
          <button
            className="px-2 py-0.5 border rounded text-sm"
            onClick={() => store.clearCachedMidspans()}
          >Clear Cached Midspans</button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="p-1">From → To</th>
            <th className="p-1">Env</th>
            <th className="p-1">Len (ft)</th>
            <th className="p-1">Segments</th>
            <th className="p-1">Midspan</th>
            <th className="p-1">Target</th>
            <th className="p-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {spans.map((s, i) => (
            <tr key={i} className="border-t">
              <td className="p-1">{s.fromId || '?'} → {s.toId || '?'}</td>
              <td className="p-1">
                <select className="border rounded px-1 py-0.5" value={s.environment || ''} onChange={e=>onEnvChange(i, e.target.value)}>
                  <option value="">(job default)</option>
                  <option value="road">Road</option>
                  <option value="residential">Residential</option>
                  <option value="pedestrian">Pedestrian</option>
                  <option value="field">Field</option>
                  <option value="residentialYard">Residential Yard</option>
                  <option value="residentialDriveway">Residential Driveway</option>
                  <option value="nonResidentialDriveway">Non-Residential Driveway</option>
                  <option value="waterway">Waterway</option>
                  <option value="interstate">Interstate</option>
                  <option value="interstateNewCrossing">Interstate (New Crossing)</option>
                  <option value="wvHighway">WV Highway</option>
                  <option value="railroad">Railroad</option>
                </select>
              </td>
              <td className="p-1">{Math.round(s.lengthFt || s.estimatedLengthFt || 0)}</td>
              <td className="p-1">
                <SegmentEditor
                  segments={Array.isArray(s.segments) ? s.segments : []}
                  onChange={(segs)=>store.updateImportedSpan(i, { segments: segs })}
                />
              </td>
              <td className="p-1">—</td>
              <td className="p-1">
                {(() => {
                  const target = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment);
                  return target != null ? formatFeetInches(target) : '—';
                })()}
              </td>
              <td className="p-1 flex gap-2">
                <button className="px-2 py-0.5 border rounded" onClick={()=>runCalc(i)}>Calculate</button>
                <button className="px-2 py-0.5 border rounded" onClick={()=>saveOnly(i)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!!(store.cachedMidspans||[]).length && (
        <div className="mt-3">
          <div className="font-medium">Cached Midspans</div>
          <ul className="list-disc pl-5 text-xs text-gray-700">
            {(store.cachedMidspans||[]).map(m => (
              <li key={m.id}>
                Span {m.spanId}: {m.spanFt} ft — midspan {m.midspanFt != null ? formatFeetInches(m.midspanFt) : '—'} vs target {m.targetFt != null ? formatFeetInches(m.targetFt) : '—'} ({m.environment || 'default'})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SegmentEditor({ segments, onChange }) {
  const [open, setOpen] = React.useState(false);
  const segs = segments || [];
  const setSeg = (idx, patch) => {
    const arr = segs.slice();
    arr[idx] = { ...(arr[idx]||{}), ...patch };
    onChange(arr);
  };
  const addSeg = () => onChange([...(segs||[]), { env: 'road', portion: 100 - (segs||[]).reduce((a,b)=>a+(Number(b.portion)||0),0) }]);
  const removeSeg = (idx) => onChange((segs||[]).filter((_,i)=>i!==idx));
  const total = (segs||[]).reduce((a,b)=>a+(Number(b.portion)||0),0);
  return (
    <div>
      <button className="px-2 py-0.5 border rounded text-xs" onClick={()=>setOpen(o=>!o)}>{open ? 'Hide' : 'Segments'}</button>
      {open && (
        <div className="mt-1 border rounded p-1">
          {(segs||[]).map((sg, i) => (
            <div key={i} className="flex items-center gap-1 mb-1">
              <select className="border rounded px-1 py-0.5 text-xs" value={sg.env||'road'} onChange={e=>setSeg(i, { env: e.target.value })}>
                <option value="road">Road</option>
                <option value="residential">Residential</option>
                <option value="pedestrian">Pedestrian</option>
                <option value="field">Field</option>
                <option value="residentialYard">Residential Yard</option>
                <option value="residentialDriveway">Residential Driveway</option>
                <option value="nonResidentialDriveway">Non-Residential Driveway</option>
                <option value="waterway">Waterway</option>
                <option value="interstate">Interstate</option>
                <option value="interstateNewCrossing">Interstate (New Crossing)</option>
                <option value="wvHighway">WV Highway</option>
                <option value="railroad">Railroad</option>
              </select>
              <input
                className="border rounded px-1 py-0.5 w-16 text-xs"
                type="number"
                min="0"
                max="100"
                step="1"
                value={sg.portion ?? ''}
                onChange={e=>setSeg(i, { portion: Number(e.target.value) })}
                placeholder="%"
              />
              <button className="px-1 py-0.5 border rounded text-xs" onClick={()=>removeSeg(i)}>x</button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <button className="px-2 py-0.5 border rounded text-xs" onClick={addSeg}>Add</button>
            <span className={`text-[10px] ${total>100 ? 'text-red-600':'text-gray-600'}`}>Total: {total}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
