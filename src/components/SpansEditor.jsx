import React from 'react';
import PropTypes from 'prop-types';
import useAppStore from '../utils/store';
import { computeAnalysis, formatFeetInches } from '../utils/calculations';
import { controllingGroundTarget } from '../utils/targets';

function SegmentEditor({ segments, onChange }) {
  const [open, setOpen] = React.useState(false);
  const segs = segments || [];
  const setSeg = (idx, patch) => {
    const arr = segs.slice();
    arr[idx] = { ...(arr[idx] || {}), ...patch };
    onChange(arr);
  };
  const addSeg = () => onChange([
    ...(segs || []),
    {
      id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      env: 'road',
      portion: 100 - (segs || []).reduce((a, b) => a + (Number(b.portion) || 0), 0)
    }
  ]);
  const removeSeg = (idx) => onChange((segs || []).filter((_, i) => i !== idx));
  const total = (segs || []).reduce((a, b) => a + (Number(b.portion) || 0), 0);
  return (
    <div>
      <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setOpen(o => !o)}>
        {open ? 'Hide' : 'Edit'}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {segs.length ? segs.map((sg, i) => (
            <div key={sg.id ?? `${sg.env || 'env'}-${sg.portion ?? ''}`} className="flex items-center gap-2">
              <select
                className="border rounded px-1 py-0.5 text-xs"
                value={sg.env || ''}
                onChange={e => setSeg(i, { env: e.target.value })}
              >
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
                onChange={e => setSeg(i, { portion: Number(e.target.value) })}
                placeholder="%"
              />
              <button className="px-1 py-0.5 border rounded text-xs" onClick={() => removeSeg(i)}>x</button>
            </div>
          )) : (
            <div className="text-xs text-gray-500">No segments</div>
          )}
          <div className="flex items-center gap-2">
            <button className="px-2 py-0.5 border rounded text-xs" onClick={addSeg}>Add</button>
            <span className={`text-[10px] ${total > 100 ? 'text-red-600' : 'text-gray-600'}`}>Total: {total}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

SegmentEditor.propTypes = {
  segments: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

export default function SpansEditor() {
  const store = useAppStore();
  const spans = React.useMemo(() => store.importedSpans || [], [store.importedSpans]);
  const [openDetail, setOpenDetail] = React.useState(null); // row index for mobile-friendly details
  const [showFailOnly, setShowFailOnly] = React.useState(false);
  const [showBigDeltaOnly, setShowBigDeltaOnly] = React.useState(false);

  const onEnvChange = (idx, val) => {
    store.updateImportedSpan(idx, { environment: val });
  };


  const getEffectiveProfile = React.useCallback(() => {
    const job = (store.jobs || []).find(j => j.id === store.currentJobId);
    const name = job?.submissionProfileName || store.currentSubmissionProfile;
    const base = (store.submissionProfiles || []).find(p => p.name === name) || {};
    return { ...base, ...(job?.submissionProfileOverrides || {}) };
  }, [store.jobs, store.currentJobId, store.currentSubmissionProfile, store.submissionProfiles]);

  const controllingTargetFromSegments = React.useCallback((segments, fallbackEnv) => controllingGroundTarget(getEffectiveProfile(), segments, fallbackEnv), [getEffectiveProfile]);

  // Helpers to resolve pole coordinates and infer endpoints when unlabeled
  const getAllPoles = React.useCallback(() => {
    const poles = [...(store.importedPoles || []), ...(store.collectedPoles || [])];
    // Normalize property names to { id, latitude, longitude }
    return poles.map(p => ({
      id: p.id || p.poleId || p.name || '',
      latitude: typeof p.latitude === 'number' ? p.latitude : Number(p.latitude),
      longitude: typeof p.longitude === 'number' ? p.longitude : Number(p.longitude),
      jobId: p.jobId || ''
    })).filter(p => p.id && Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  }, [store.importedPoles, store.collectedPoles]);
  const poleIndex = React.useCallback(() => {
    const idx = new Map();
    for (const p of getAllPoles()) idx.set(String(p.id), p);
    return idx;
  }, [getAllPoles]);
  const haversineFt = React.useCallback((lat1, lon1, lat2, lon2) => {
    const toRad = (d) => d * Math.PI / 180;
    const Rm = 6371000; // meters
    const dLat = toRad((lat2 || 0) - (lat1 || 0));
    const dLon = toRad((lon2 || 0) - (lon1 || 0));
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1 || 0)) * Math.cos(toRad(lat2 || 0)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = Rm * c;
    return meters * 3.28084; // feet
  }, []);
  const midpoint = (a, b) => {
    if (!a || !b) return null;
    return { lat: (a.latitude + b.latitude) / 2, lon: (a.longitude + b.longitude) / 2 };
  };
  const getSpanLengthFt = React.useCallback((s) => {
    if (!s) return undefined;
    const idx = poleIndex();
    const f = s.fromId != null ? idx.get(String(s.fromId)) : undefined;
    const t = s.toId != null ? idx.get(String(s.toId)) : undefined;
    if (f && t) {
      const ft = haversineFt(f.latitude, f.longitude, t.latitude, t.longitude);
      return Number.isFinite(ft) ? Math.round(ft) : undefined;
    }
    return undefined;
  }, [poleIndex, haversineFt]);
  const inferEndpointsForSpan = (s) => {
    const idx = poleIndex();
    // Helper to get pole by id
    const getPole = (id) => id != null ? idx.get(String(id)) : undefined;
    let from = getPole(s.fromId);
    let to = getPole(s.toId);
    let mid = (from && to) ? midpoint(from, to) : null;

    // Early return if endpoints are present
    if (from && to) {
      const midCoord = midpoint(from, to);
      return {
        from: { id: from.id, lat: from.latitude, lon: from.longitude },
        to: { id: to.id, lat: to.latitude, lon: to.longitude },
        mid: midCoord ? { lat: midCoord.lat, lon: midCoord.lon } : null,
      };
    }

    // Try inferring endpoints if missing
    let hintMid = mid;
    if (!hintMid) {
      const lat = Number(store.poleLatitude);
      const lon = Number(store.poleLongitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) hintMid = { lat, lon };
    }
    const poles = Array.from(idx.values());
    if (hintMid && poles.length >= 2) {
      // pick nearest two poles to the hint midpoint
      const sorted = poles
        .map(p => ({ p, d: haversineFt(hintMid.lat, hintMid.lon, p.latitude, p.longitude) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
        .map(x => x.p);
      if (!from && sorted[0]) s.fromId = sorted[0].id;
      if (!to && sorted[1]) s.toId = sorted[1].id;
      from = getPole(s.fromId);
      to = getPole(s.toId);
    }
    const midCoord = (from && to) ? midpoint(from, to) : null;
    return {
      from: from ? { id: from.id, lat: from.latitude, lon: from.longitude } : null,
      to: to ? { id: to.id, lat: to.latitude, lon: to.longitude } : null,
      mid: midCoord ? { lat: midCoord.lat, lon: midCoord.lon } : null,
    };
  };

  // Derived analytics for spans (midspan PASS/FAIL and delta buckets)

  const derived = React.useMemo(() => {
    // Build pole index once per calculation cycle to avoid O(n) Map rebuild per span
    const idx = poleIndex();

    // Fast span length using the precomputed index
    const getSpanLengthFtFast = (s) => {
      if (!s) return undefined;
      const get = (id) => (id != null ? idx.get(String(id)) : undefined);
      const f = get(s.fromId);
      const t = get(s.toId);
      if (f && t) {
        const ft = haversineFt(f.latitude, f.longitude, t.latitude, t.longitude);
        return Number.isFinite(ft) ? Math.round(ft) : undefined;
      }
      return undefined;
    };

    // Modular analytics for multi data-set inference
    function getSpanMeta(s) {
      const autoLen = getSpanLengthFtFast(s);
      const hasManual = !!s.lengthFt;
      const manualLen = hasManual ? Number(s.lengthFt) : null;
      const shownLen = store.preferAutoSpanLength ? (autoLen || manualLen || 0) : (manualLen || autoLen || 0);
      const delta = (autoLen != null && manualLen != null) ? Math.abs(autoLen - manualLen) : 0;
      const bigDelta = delta >= (Number(store.spanLenDeltaThresholdFt) || 10);
      const endpoints = Boolean(s.fromId && s.toId);
      let pass = null, fail = null;
      try {
        const a = computeAnalysis({
          poleHeight: store.poleHeight || 35,
          existingPowerHeight: store.existingPowerHeight || '',
          existingPowerVoltage: store.existingPowerVoltage || 'distribution',
          spanDistance: shownLen,
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
        const target = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment) ?? a?.results?.clearances?.groundClearance;
        const mid = a?.results?.span?.midspanFt;
        if (mid != null && target != null) {
          pass = Number(mid) >= Number(target);
          fail = !pass;
        }
      } catch { /* intentionally ignore analysis errors for summary */ }
      return { ...s, autoLen, manualLen, shownLen, delta, bigDelta, endpoints, pass, fail };
    }

    // Aggregate analytics for all spans
    const list = spans.map(getSpanMeta);
    const counts = {
      total: list.length,
      withEndpoints: list.filter(x => x.endpoints).length,
      autoAvailable: list.filter(x => x.autoLen).length,
      manualCount: list.filter(x => x.manualLen != null).length,
      pass: list.filter(x => x.pass === true).length,
      fail: list.filter(x => x.fail === true).length,
    };
    const buckets = {
      '≤5ft': list.filter(x => x.delta <= 5).length,
      '6–15ft': list.filter(x => x.delta > 5 && x.delta <= 15).length,
      '16–30ft': list.filter(x => x.delta > 15 && x.delta <= 30).length,
      '>30ft': list.filter(x => x.delta > 30).length,
    };
    return { list, counts, buckets };
  }, [
    spans,
    store.preferAutoSpanLength,
    store.spanLenDeltaThresholdFt,
    store.poleHeight,
    store.existingPowerHeight,
    store.existingPowerVoltage,
    store.isNewConstruction,
    store.adjacentPoleHeight,
    store.attachmentType,
    store.cableDiameter,
    store.windSpeed,
    store.spanEnvironment,
    store.dripLoopHeight,
    store.proposedLineHeight,
    store.existingLines,
    store.iceThicknessIn,
    store.hasTransformer,
    store.presetProfile,
    store.customMinTopSpace,
    store.customRoadClearance,
    store.customCommToPower,
    store.powerReference,
    store.jobOwner,
    controllingTargetFromSegments,
    getEffectiveProfile,
    poleIndex,
    haversineFt,
  ]);

  const isRowVisible = (i) => {
    const r = derived.list[i];
    if (showFailOnly && r?.pass !== false) return false;
    if (showBigDeltaOnly && !r?.bigDelta) return false;
    return true;
  };

  // --- UI helpers to reduce complexity in render ---
  const sourceLabel = (preferAuto, s, autoLen) => {
    if (preferAuto && autoLen) return 'auto';
    if (s.lengthFt) return 'manual';
    if (s.estimatedLengthFt) return 'est';
    if (autoLen) return 'auto*';
    return '—';
  };
  const sourceTitle = (preferAuto, s, autoLen) => {
    if (preferAuto && autoLen) return 'Using auto length from coordinates';
    if (s.lengthFt) return 'Using manual length';
    if (s.estimatedLengthFt) return 'Using estimated length';
    if (autoLen) return 'Auto length available';
    return 'No length available';
  };
  const computeInlineStatus = (s, preferAuto, autoLen) => {
    try {
      const spanDistance = preferAuto ? (autoLen || s.lengthFt || s.estimatedLengthFt || 0) : (s.lengthFt || s.estimatedLengthFt || autoLen || 0);
      const a = computeAnalysis(buildAnalysisInput(s, spanDistance));
      const target = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment) ?? a?.results?.clearances?.groundClearance;
      const mid = a?.results?.span?.midspanFt;
      if (mid != null && target != null) return Number(mid) >= Number(target);
    } catch { /* ignore analysis preview errors */ }
    return null;
  };
  const computeAutoDetailStatus = (s, autoLen) => {
    try {
      const a = computeAnalysis(buildAnalysisInput(s, autoLen || 0));
      const target = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment) ?? a?.results?.clearances?.groundClearance;
      const mid = a?.results?.span?.midspanFt;
      const ok = (mid != null && target != null) ? (Number(mid) >= Number(target)) : null;
      return { mid, target, ok };
    } catch { return { mid: null, target: null, ok: null }; }
  };
  const buildAutoTip = (autoLen, f, t) => (
    autoLen && f && t ? `auto: ${autoLen} ft\nfrom (${f.latitude?.toFixed?.(6)}, ${f.longitude?.toFixed?.(6)})\nto   (${t.latitude?.toFixed?.(6)}, ${t.longitude?.toFixed?.(6)})` : ''
  );

  // Shared helpers to reduce duplication/complexity
  const buildAnalysisInput = (s, spanDistance) => ({
    poleHeight: store.poleHeight || 35,
    existingPowerHeight: store.existingPowerHeight || '',
    existingPowerVoltage: store.existingPowerVoltage || 'distribution',
    spanDistance,
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

  const determineSpanLenSource = (preferAuto, autoLen, s) => {
    if (preferAuto) {
      if (autoLen) return 'auto';
      if (s.lengthFt) return 'lengthFt';
      if (s.estimatedLengthFt) return 'estimatedLengthFt';
      return 'unknown';
    }
    if (s.lengthFt) return 'lengthFt';
    if (s.estimatedLengthFt) return 'estimatedLengthFt';
    if (autoLen) return 'auto';
    return 'unknown';
  };

  const runCalc = (idx) => {
    const s = spans[idx];
    const autoLen = getSpanLengthFt(s);
    // Refactored to reduce cognitive complexity
    const preferAuto = !!store.preferAutoSpanLength;
    const spanLenSource = determineSpanLenSource(preferAuto, autoLen, s);
    const spanDistance = preferAuto ? (autoLen || s.lengthFt || s.estimatedLengthFt || 0) : (s.lengthFt || s.estimatedLengthFt || autoLen || 0);
    const a = computeAnalysis(buildAnalysisInput(s, spanDistance));
    if (a?.results) {
      const controllingTargetFt = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment);
      const coords = inferEndpointsForSpan(s);
      // Persist inferred endpoints back into the span row for clarity
      const endpointPatch = {};
      if ((s.fromId == null || s.fromId === '') && coords?.from?.id) endpointPatch.fromId = coords.from.id;
      if ((s.toId == null || s.toId === '') && coords?.to?.id) endpointPatch.toId = coords.to.id;
      if (Object.keys(endpointPatch).length) store.updateImportedSpan(idx, endpointPatch);
      // Compute metadata
      const mid = a.results.span.midspanFt;
      const target = controllingTargetFt ?? a.results.clearances.groundClearance;
      let pass = null;
      if (mid != null && target != null) pass = Number(mid) >= Number(target);
      const deficitFt = (pass === false) ? Math.max(0, Number(target) - Number(mid)) : (pass === true ? 0 : null);
      const manualLen = s.lengthFt != null ? Number(s.lengthFt) : null;
      const autoLen2 = getSpanLengthFt(s) ?? null;
      const deltaFt = (manualLen != null && autoLen2 != null) ? Math.abs(manualLen - autoLen2) : null;
      store.addCachedMidspan({
        spanId: s.id || `${idx + 1}`,
        environment: s.environment || store.spanEnvironment,
        spanFt: a.results.span.spanFt,
        midspanFt: a.results.span.midspanFt,
        targetFt: controllingTargetFt ?? a.results.clearances.groundClearance,
        attachFt: a.results.attach.proposedAttachFt,
        segments: Array.isArray(s.segments) ? s.segments : null,
        spanLenSource,
        pass,
        deficitFt,
        deltaFt,
        // coordinates
        midLat: coords?.mid?.lat ?? '',
        midLon: coords?.mid?.lon ?? '',
        fromId: coords?.from?.id ?? '',
        toId: coords?.to?.id ?? '',
        fromLat: coords?.from?.lat ?? '',
        fromLon: coords?.from?.lon ?? '',
        toLat: coords?.to?.lat ?? '',
        toLon: coords?.to?.lon ?? '',
      });
    }
  };

  const saveOnly = (idx) => {
    const s = spans[idx];
    const coords = inferEndpointsForSpan(s);
    const autoLen = getSpanLengthFt(s);
    const preferAuto = !!store.preferAutoSpanLength;
    const spanLenSource = determineSpanLenSource(preferAuto, autoLen, s);
    // Persist inferred endpoints back into the span row for clarity
    const endpointPatch = {};
    if ((s.fromId == null || s.fromId === '') && coords?.from?.id) endpointPatch.fromId = coords.from.id;
    if ((s.toId == null || s.toId === '') && coords?.to?.id) endpointPatch.toId = coords.to.id;
    if (Object.keys(endpointPatch).length) store.updateImportedSpan(idx, endpointPatch);
    const manualLen = s.lengthFt != null ? Number(s.lengthFt) : null;
    const deltaFt = (manualLen != null && autoLen != null) ? Math.abs(manualLen - autoLen) : null;
    store.addCachedMidspan({
      spanId: s.id || `${idx + 1}`,
      environment: s.environment || store.spanEnvironment,
      spanFt: preferAuto ? (autoLen || s.lengthFt || s.estimatedLengthFt || 0) : (s.lengthFt || s.estimatedLengthFt || autoLen || 0),
      midspanFt: null,
      targetFt: controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment) ?? null,
      attachFt: null,
      segments: Array.isArray(s.segments) ? s.segments : null,
      spanLenSource,
      pass: null,
      deficitFt: null,
      deltaFt,
      // coordinates
      midLat: coords?.mid?.lat ?? '',
      midLon: coords?.mid?.lon ?? '',
      fromId: coords?.from?.id ?? '',
      toId: coords?.to?.id ?? '',
      fromLat: coords?.from?.lat ?? '',
      fromLon: coords?.from?.lon ?? '',
      toLat: coords?.to?.lat ?? '',
      toLon: coords?.to?.lon ?? '',
    });
  };

  return (!spans.length ? null : (
    <div className="rounded border p-3 no-print">
      <div className="font-medium mb-2">Spans (Per‑span Environment & Quick Calc)</div>
      {/* Analytics summary */}
      <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
        <div className="border rounded p-2">
          <div className="font-medium mb-1">Status</div>
          <div>Total: {derived.counts.total}</div>
          <div>With endpoints: {derived.counts.withEndpoints}</div>
          <div>Auto available: {derived.counts.autoAvailable}</div>
          <div>Manual lengths: {derived.counts.manualCount}</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-medium mb-1">Compliance</div>
          <div className="text-emerald-700">PASS: {derived.counts.pass}</div>
          <div className="text-red-700">FAIL: {derived.counts.fail}</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-medium mb-1">Δ buckets (manual vs auto)</div>
          <div>≤5ft: {derived.buckets['≤5ft']}</div>
          <div>6–15ft: {derived.buckets['6–15ft']}</div>
          <div>16–30ft: {derived.buckets['16–30ft']}</div>
          <div>&gt;30ft: {derived.buckets['>30ft']}</div>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="When on, calculations use GPS auto length when available.">
          <input type="checkbox" checked={!!store.preferAutoSpanLength} onChange={(e) => store.setPreferAutoSpanLength(e.target.checked)} />
          <span className="ml-1">Prefer auto length</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Row density affects padding and font size">
          <span className="mr-1">Density</span>
          <select className="border rounded px-1 py-0.5 text-xs" value={store.tableDensity} onChange={e => store.setTableDensity(e.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Show only FAIL rows based on midspan vs target">
          <input type="checkbox" checked={showFailOnly} onChange={(e) => setShowFailOnly(e.target.checked)} />
          <span className="ml-1">Only FAIL</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Show only rows where manual vs auto Δ ≥ threshold">
          <input type="checkbox" checked={showBigDeltaOnly} onChange={(e) => setShowBigDeltaOnly(e.target.checked)} />
          <span className="ml-1">Only big Δ</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Show/Hide Segments column">
          <input type="checkbox" checked={!!store.spansColumnSegmentsVisible} onChange={(e) => store.setSpansColumnSegmentsVisible(e.target.checked)} />
          <span className="ml-1">Segments</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Show/Hide Actions column">
          <input type="checkbox" checked={!!store.spansColumnActionsVisible} onChange={(e) => store.setSpansColumnActionsVisible(e.target.checked)} />
          <span className="ml-1">Actions</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-gray-700" title="Highlight Δ badge when manual vs auto length differs by this amount or more.">
          <span className="mr-1">Δ threshold (ft)</span>
          <input
            className="border rounded px-1 py-0.5 w-16 text-xs"
            type="number" min="0" step="1"
            value={store.spanLenDeltaThresholdFt ?? 10}
            onChange={(e) => store.setSpanLenDeltaThresholdFt(e.target.value)}
          />
        </label>
        {!!(store.cachedMidspans || []).length && (
          <button
            className="px-2 py-0.5 border rounded text-sm"
            onClick={() => {
              const rows = [['spanId', 'environment', 'spanFt', 'spanLenSource', 'midspanFt', 'targetFt', 'attachFt', 'pass', 'deficitFt', 'deltaFt', 'midLat', 'midLon', 'fromId', 'toId', 'fromLat', 'fromLon', 'toLat', 'toLon', 'segments']];
              for (const m of (store.cachedMidspans || [])) {
                rows.push([
                  m.spanId ?? '',
                  m.environment ?? '',
                  m.spanFt ?? '',
                  m.spanLenSource ?? '',
                  m.midspanFt ?? '',
                  m.targetFt ?? '',
                  m.attachFt ?? '',
                  (m.pass === true ? 'PASS' : (m.pass === false ? 'FAIL' : '')),
                  m.deficitFt ?? '',
                  m.deltaFt ?? '',
                  m.midLat ?? '',
                  m.midLon ?? '',
                  m.fromId ?? '',
                  m.toId ?? '',
                  m.fromLat ?? '',
                  m.fromLon ?? '',
                  m.toLat ?? '',
                  m.toLon ?? '',
                  Array.isArray(m.segments) ? m.segments.map(x => `${x.env}:${x.portion || ''}`).join('|') : '',
                ]);
              }
              const csv = rows.map(r => r.map(v => String(v).replaceAll('"', '""')).map(v => v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'cached_midspans.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >Export Cached Midspans (CSV)</button>
        )}
        {!!(store.cachedMidspans || []).length && (
          <button
            className="px-2 py-0.5 border rounded text-sm"
            onClick={() => store.clearCachedMidspans()}
          >Clear Cached Midspans</button>
        )}
        <button
          className="px-2 py-0.5 border rounded text-sm"
          onClick={() => {
            const idx = poleIndex();
            (store.importedSpans || []).forEach((s, i) => {
              const f = s.fromId != null ? idx.get(String(s.fromId)) : undefined;
              const t = s.toId != null ? idx.get(String(s.toId)) : undefined;
              if (f && t) {
                const ft = Math.round(haversineFt(f.latitude, f.longitude, t.latitude, t.longitude));
                if (Number.isFinite(ft)) store.updateImportedSpan(i, { lengthFt: ft });
              }
            });
          }}
        >Auto‑calc All Lengths</button>
        <button
          className="px-2 py-0.5 border rounded text-sm"
          title="Compute analysis for all spans and add to cache"
          onClick={() => {
            spans.forEach((_, i) => { try { runCalc(i); } catch { /* ignore */ } });
          }}
        >Compute All (cache)</button>
        <button
          className="px-2 py-0.5 border rounded text-sm"
          title="Clear cache and recompute for all spans"
          onClick={() => {
            try { store.clearCachedMidspans(); } catch { /* ignore */ }
            spans.forEach((_, i) => { try { runCalc(i); } catch { /* ignore */ } });
          }}
        >Recompute All</button>
        <button
          className="px-2 py-0.5 border rounded text-sm"
          title="Infer endpoints for spans missing From/To using nearest poles"
          onClick={() => {
            (store.importedSpans || []).forEach((s, i) => {
              if (s.fromId && s.toId) return;
              const coords = inferEndpointsForSpan({ ...s });
              const patch = {};
              if (!s.fromId && coords?.from?.id) patch.fromId = coords.from.id;
              if (!s.toId && coords?.to?.id) patch.toId = coords.to.id;
              if (Object.keys(patch).length) store.updateImportedSpan(i, patch);
            });
          }}
        >Infer Endpoints (All)</button>
        <button
          className="px-2 py-0.5 border rounded text-sm"
          title="Overwrite manual lengths with auto-calculated where endpoints are known"
          onClick={() => {
            const idx = poleIndex();
            (store.importedSpans || []).forEach((s, i) => {
              const f = s.fromId != null ? idx.get(String(s.fromId)) : undefined;
              const t = s.toId != null ? idx.get(String(s.toId)) : undefined;
              if (!f || !t) return;
              const ft = Math.round(haversineFt(f.latitude, f.longitude, t.latitude, t.longitude));
              if (Number.isFinite(ft)) store.updateImportedSpan(i, { lengthFt: ft });
            });
          }}
        >Replace all with auto</button>
      </div>
      <div className="overflow-x-auto break-anywhere">
        <table className={`w-full ${store.tableDensity === 'compact' ? 'text-[11px]' : 'text-xs md:text-sm'}`}>
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-left text-gray-700">
              <th className="p-1">From → To</th>
              <th className="p-1">Env</th>
              <th className="p-1">Len (ft)</th>
              {store.spansColumnSegmentsVisible ? <th className="p-1">Segments</th> : null}
              <th className="p-1">Midspan</th>
              <th className="p-1">Target</th>
              {store.spansColumnActionsVisible ? <th className="p-1">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {spans.map((s, i) => {
              if (!isRowVisible(i)) return null;
              const autoLen = getSpanLengthFt(s);
              const preferAuto = !!store.preferAutoSpanLength;
              const current = Math.round(s.lengthFt || s.estimatedLengthFt || 0);
              const shown = preferAuto ? (autoLen || current || 0) : (current || autoLen || 0);
              const needsSet = autoLen && autoLen !== s.lengthFt;
              const idxMap = poleIndex();
              const f = s.fromId != null ? idxMap.get(String(s.fromId)) : undefined;
              const t = s.toId != null ? idxMap.get(String(s.toId)) : undefined;
              const tip = buildAutoTip(autoLen, f, t);
              const hasManual = !!s.lengthFt;
              const delta = (autoLen && hasManual) ? Math.abs(Number(autoLen) - Number(s.lengthFt)) : 0;
              const bigDelta = delta >= (Number(store.spanLenDeltaThresholdFt) || 10);
              const inlineStatus = computeInlineStatus(s, preferAuto, autoLen);
              const showDetail = (openDetail === i && autoLen && f && t);
              const autoDetail = showDetail ? computeAutoDetailStatus(s, autoLen) : null;
              return (
                <tr key={s.id ? s.id : `span-${i}`} className={`border-t even:bg-gray-50`}>
                  <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>{s.fromId || '?'} → {s.toId || '?'}</td>
                  <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>
                    <select className="border rounded px-1 py-0.5" value={s.environment || ''} onChange={e => onEnvChange(i, e.target.value)}>
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
                  <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>
                    <span title={tip} className="relative inline-flex items-center">
                      {shown}
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded border bg-gray-50 text-gray-600" title={sourceTitle(preferAuto, s, autoLen)}>
                        {sourceLabel(preferAuto, s, autoLen)}
                      </span>
                      {(autoLen && hasManual) ? (
                        <span
                          className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${bigDelta ? 'bg-red-50 text-red-700 border-red-300' : 'bg-gray-50 text-gray-600'}`}
                          title={`Δ between manual and auto: ${delta} ft`}
                        >Δ {delta}ft</span>
                      ) : null}
                      {inlineStatus != null ? (
                        <span
                          className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${inlineStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}`}
                          title={inlineStatus ? 'Midspan ≥ target' : 'Midspan below target'}
                        >{inlineStatus ? 'PASS' : 'FAIL'}</span>
                      ) : null}
                      {autoLen && f && t ? (
                        <button
                          className="ml-1 text-xs px-1 py-0.5 border rounded"
                          onClick={(e) => { e.preventDefault(); setOpenDetail(openDetail === i ? null : i); }}
                          aria-label="Details"
                          title="Show details"
                        >i</button>
                      ) : null}
                      {showDetail && autoDetail ? (
                        <div className="absolute z-10 mt-1 left-0 bg-white border rounded shadow p-2 text-xs w-64">
                          <div className="font-medium mb-1">Auto length</div>
                          <div className="mb-1">{autoLen} ft</div>
                          <div className="text-gray-600">From: {f.latitude?.toFixed?.(6)}, {f.longitude?.toFixed?.(6)}</div>
                          <div className="text-gray-600">To: {t.latitude?.toFixed?.(6)}, {t.longitude?.toFixed?.(6)}</div>
                          <div className="mt-2">
                            <div>Midspan: {autoDetail.mid != null ? formatFeetInches(autoDetail.mid) : '—'} vs Target: {autoDetail.target != null ? formatFeetInches(autoDetail.target) : '—'}</div>
                            <div className={autoDetail.ok == null ? 'text-gray-600' : (autoDetail.ok ? 'text-emerald-700' : 'text-red-700')}>
                              {autoDetail.ok == null ? '—' : (autoDetail.ok ? 'PASS' : 'FAIL')}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="px-2 py-0.5 border rounded"
                              onClick={async () => {
                                try {
                                  const text = `fromId=${s.fromId || ''},toId=${s.toId || ''},fromLat=${f.latitude},fromLon=${f.longitude},toLat=${t.latitude},toLon=${t.longitude},autoFt=${autoLen}`;
                                  await navigator.clipboard?.writeText?.(text);
                                } catch {/* ignore */ }
                              }}
                            >Copy</button>
                            <a className="px-2 py-0.5 border rounded inline-block" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${f.latitude},${f.longitude}`}>From Map</a>
                            <a className="px-2 py-0.5 border rounded inline-block" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${t.latitude},${t.longitude}`}>To Map</a>
                            {needsSet ? (
                              <button
                                className="px-2 py-0.5 border rounded"
                                title="Set manual length to auto"
                                onClick={() => { store.updateImportedSpan(i, { lengthFt: autoLen }); }}
                              >Use auto</button>
                            ) : null}
                          </div>
                          <div className="mt-2 text-right">
                            <button className="px-2 py-0.5 border rounded" onClick={() => setOpenDetail(null)}>Close</button>
                          </div>
                        </div>
                      ) : null}
                      {needsSet && (
                        <button
                          className="ml-2 px-1 py-0.5 border rounded text-xs"
                          onClick={() => store.updateImportedSpan(i, { lengthFt: autoLen })}
                          title="Set length from coordinates"
                        >set</button>
                      )}
                    </span>
                  </td>
                  {store.spansColumnSegmentsVisible ? (
                    <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>
                      <SegmentEditor
                        segments={Array.isArray(s.segments) ? s.segments : []}
                        onChange={(segs) => store.updateImportedSpan(i, { segments: segs })}
                      />
                    </td>
                  ) : null}
                  <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>—</td>
                  <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'}`}>
                    {(() => {
                      const target = controllingTargetFromSegments(s.segments, s.environment || store.spanEnvironment);
                      return target != null ? formatFeetInches(target) : '—';
                    })()}
                  </td>
                  {store.spansColumnActionsVisible ? (
                    <td className={`px-2 ${store.tableDensity === 'compact' ? 'py-0.5' : 'py-1'} flex gap-2`}>
                      <button className="px-2 py-0.5 border rounded" onClick={() => runCalc(i)}>Calculate</button>
                      <button className="px-2 py-0.5 border rounded" onClick={() => saveOnly(i)}>Save</button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!!(store.cachedMidspans || []).length && (
        <div className="mt-3">
          <div className="font-medium">Cached Midspans</div>
          <ul className="list-disc pl-5 text-xs text-gray-700">
            {(store.cachedMidspans || []).map(m => {
              const ok = (m.midspanFt != null && m.targetFt != null) ? (Number(m.midspanFt) >= Number(m.targetFt)) : null;
              let statusText = '';
              let statusClass = '';
              if (ok != null) {
                statusText = ok ? 'PASS' : 'FAIL';
                statusClass = ok ? 'ml-1 text-emerald-700' : 'ml-1 text-red-700';
              }
              return (
                <li key={m.id}>
                  Span {m.spanId}: {m.spanFt} ft — midspan {m.midspanFt != null ? formatFeetInches(m.midspanFt) : '—'} vs target {m.targetFt != null ? formatFeetInches(m.targetFt) : '—'} ({m.environment || 'default'})
                  {statusText ? (
                    <span className={statusClass}>— {statusText}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  ));
}
