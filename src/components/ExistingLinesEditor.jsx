import React from 'react';
import useAppStore from '../utils/store';
import { formatFeetInchesTickMarks, formatFeetInchesVerbose, parseFeet } from '../utils/calculations';
import { WV_COMPANIES } from '../utils/constants';

const LINE_TYPES = [
  { label: 'Communication', value: 'communication' },
  { label: 'Drop (Comm)', value: 'drop' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Power Secondary', value: 'secondary' },
];

export default function ExistingLinesEditor() {
  const { existingLines, setExistingLines, csvLineMapping, setCsvLineMapping, useTickMarkFormat } = useAppStore();
  const fmt = useTickMarkFormat ? formatFeetInchesTickMarks : formatFeetInchesVerbose;
  const [showCsv, setShowCsv] = React.useState(false);
  const [csvText, setCsvText] = React.useState('');
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [headers, setHeaders] = React.useState([]);

  // Simple CSV parser supporting quoted fields and commas
  const parseCSV = (text) => {
    const rows = [];
    let i = 0, field = '', row = [], inQuotes = false;
    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { if (row.length) rows.push(row); row = []; };
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i+1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') pushField();
        else if (ch === '\n') { pushField(); pushRow(); }
        else if (ch === '\r') { /* skip */ }
        else field += ch;
      }
      i++;
    }
    // flush last field/row
    pushField(); pushRow();
    // Trim headers and values
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c.length));
  };

  const update = (idx, field, value) => {
    const copy = existingLines.slice();
    copy[idx] = { ...copy[idx], [field]: value };
    setExistingLines(copy);
  };

  const addRow = () => setExistingLines([ ...existingLines, { type: 'communication', height: '', makeReady: false, makeReadyHeight: '', companyName: '' } ]);
  const removeRow = (idx) => setExistingLines(existingLines.filter((_, i) => i !== idx));
  const duplicateRow = (idx) => {
    const arr = existingLines.slice();
    const copy = { ...arr[idx] };
    arr.splice(idx + 1, 0, copy);
    setExistingLines(arr);
  };
  const moveRow = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= existingLines.length) return;
    const arr = existingLines.slice();
    const [item] = arr.splice(idx, 1);
    arr.splice(to, 0, item);
    setExistingLines(arr);
  };

  const importCSV = () => {
    const parsed = parseCSV(csvText || '');
    if (!parsed.length) return;
    const header = parsed[0];
    setHeaders(header);
    const idx = (name) => header.findIndex(h => h.toLowerCase() === String(name).toLowerCase());
    const iType = idx(csvLineMapping.type || 'type');
    const iCompany = idx(csvLineMapping.company || 'company');
    const iHeight = idx(csvLineMapping.height || 'height');
    const iMr = idx(csvLineMapping.makeReady || 'makeReady');
    const iMrH = idx(csvLineMapping.makeReadyHeight || 'makeReadyHeight');
    const rows = [];
    for (let r = 1; r < parsed.length; r++) {
      const cols = parsed[r];
      const get = (i) => (i >= 0 && i < cols.length ? cols[i] : '');
      rows.push({
        type: get(iType) || 'communication',
        companyName: get(iCompany),
        height: get(iHeight),
        makeReady: /^(y|yes|true|1)$/i.test(get(iMr)),
        makeReadyHeight: get(iMrH),
      });
    }
    if (rows.length) setExistingLines(rows);
    setShowCsv(false);
    setCsvText('');
  };

  const exportCSV = () => {
    const header = ['type','company','height','makeReady','makeReadyHeight'];
    const rows = existingLines.map(r => [
      r.type || '',
      r.companyName || '',
      r.height || '',
      r.makeReady ? 'true' : 'false',
      r.makeReadyHeight || ''
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.map(v=>`${String(v).replaceAll('"','""')}`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'existing-lines.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const rowDeltaInches = (row) => {
    if (!row.makeReady || !row.makeReadyHeight || !row.height) return 0;
    const base = parseFeet(row.height);
    const next = parseFeet(row.makeReadyHeight);
    if (base == null || next == null) return 0;
    return Math.round((next - base) * 12);
  };

  const rowCost = (row) => Math.abs(rowDeltaInches(row)) * 12.5;
  const totalCost = existingLines.reduce((sum, r) => sum + rowCost(r), 0);
  const exportSummaryCSV = () => {
    const byCompany = existingLines.reduce((acc, r) => {
      if (!r.makeReady) return acc;
      const key = r.companyName || '—';
      const deltaIn = Math.abs(Math.round(((parseFeet(r.makeReadyHeight)||0) - (parseFeet(r.height)||0))*12));
      const cost = deltaIn * 12.5;
      const cur = acc[key] || { rows: 0, deltaInches: 0, totalCost: 0 };
      cur.rows += 1; cur.deltaInches += deltaIn; cur.totalCost += cost; acc[key] = cur; return acc;
    }, {});
    const header = ['company','rows','deltaInches','totalCost'];
    const rows = Object.entries(byCompany).map(([k,v]) => [k, v.rows, v.deltaInches, v.totalCost]);
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'make-ready-summary.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Existing Lines</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowCsv(s=>!s)} className="text-sm px-2 py-1 border rounded">{showCsv ? 'Hide CSV' : 'Import CSV'}</button>
          <button onClick={exportCSV} className="text-sm px-2 py-1 border rounded">Export CSV</button>
          <button onClick={exportSummaryCSV} className="text-sm px-2 py-1 border rounded">Export Summary</button>
          <button onClick={()=>setExistingLines([])} className="text-sm px-2 py-1 border rounded">Clear</button>
          <button onClick={addRow} className="text-sm px-2 py-1 border rounded">Add</button>
        </div>
      </div>
  {showCsv && (
        <div className="mb-2">
          <textarea className="w-full h-28 border rounded p-2 text-xs" placeholder="Paste CSV with headers: type,company,height,makeReady,makeReadyHeight" value={csvText} onChange={e=>setCsvText(e.target.value)} />
          <div className="flex items-center gap-2 mt-1">
    <button onClick={()=>setShowMapModal(true)} className="text-sm px-2 py-1 border rounded">Map Columns</button>
    <button onClick={()=>{
      // Auto-map headers using simple keyword heuristics
      const lines = parseCSV(csvText || '');
      if (!lines.length) return;
      const hdr = lines[0].map(h=>h.toLowerCase());
      const pick = (alts) => {
        for (const a of alts) { const i = hdr.indexOf(a); if (i >= 0) return lines[0][i]; }
        // fallback contains
        for (const h of lines[0]) {
          if (alts.some(a => h.toLowerCase().includes(a))) return h;
        }
        return '';
      };
      setCsvLineMapping({
        type: pick(['type','linetype','category']),
        company: pick(['company','owner','provider']),
        height: pick(['height','ht','hgt']),
        makeReady: pick(['makeready','mr','mr_flag']),
        makeReadyHeight: pick(['newheight','mr_height','mrh','makereadyheight'])
      });
    }} className="text-sm px-2 py-1 border rounded">Auto-map Headers</button>
    <button onClick={importCSV} className="text-sm px-2 py-1 border rounded">Use CSV</button>
            <div className="text-xs text-gray-600">Replaces current table</div>
          </div>
        </div>
      )}
  <div className="overflow-auto break-anywhere">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Type</th>
              <th className="p-2">Owner</th>
              <th className="p-2">Height (ft/in)</th>
              <th className="p-2">Make‑ready?</th>
              <th className="p-2">New Height (ft/in)</th>
              <th className="p-2">Δ / Est. Cost</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {existingLines.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">
                  <select className="form-input" value={row.type}
                          onChange={e=>update(idx, 'type', e.target.value)}>
                    <option value="">Select</option>
                    {LINE_TYPES.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <input list="wv-companies" className="form-input" value={row.companyName || ''}
                         onChange={e=>update(idx, 'companyName', e.target.value)} placeholder="e.g., Mon Power (Owner)" />
                  <datalist id="wv-companies">
                    {WV_COMPANIES.power.map(c => <option key={`p-${c.name}`} value={c.short || c.name}>{c.name}</option>)}
                    {WV_COMPANIES.communication.map(c => <option key={`c-${c.name}`} value={c.short || c.name}>{c.name}</option>)}
                  </datalist>
                  <div className="text-[10px] text-gray-500 mt-0.5">Tip: Use FE subsidiary names (Mon Power, Penelec, etc.) for FE rules.</div>
                </td>
                <td className="p-2">
                  <input className={`border rounded px-2 py-1 ${row.height && parseFeet(row.height) == null ? 'border-red-400 bg-red-50' : ''}`} value={row.height || ''}
                         onChange={e=>update(idx, 'height', e.target.value)} placeholder={'e.g., 18\' 6"'} />
                </td>
                <td className="p-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" checked={!!row.makeReady} onChange={e=>update(idx, 'makeReady', e.target.checked)} />
                    <span>Yes</span>
                  </label>
                </td>
                <td className="p-2">
                  <input className={`border rounded px-2 py-1 ${row.makeReady && row.makeReadyHeight && parseFeet(row.makeReadyHeight) == null ? 'border-red-400 bg-red-50' : ''}`} value={row.makeReadyHeight || ''} disabled={!row.makeReady}
                         onChange={e=>update(idx, 'makeReadyHeight', e.target.value)} placeholder={'e.g., 19\' 6"'} />
                  {row.makeReady && row.makeReadyHeight && row.height && parseFeet(row.makeReadyHeight) != null && parseFeet(row.height) != null ? (
                    <div className="text-xs text-gray-500 mt-1">
                      Δ {fmt(parseFeet(row.makeReadyHeight) - parseFeet(row.height))}
                    </div>
                  ) : null}
                </td>
                <td className="p-2 whitespace-nowrap text-xs text-gray-700">
                  {row.makeReady ? (
                    <>
                      {rowDeltaInches(row)}" / ${rowCost(row)}
                    </>
                  ) : '—'}
                </td>
                <td className="p-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={()=>moveRow(idx, -1)} className="text-xs">↑</button>
                    <button onClick={()=>moveRow(idx, 1)} className="text-xs">↓</button>
                    <button onClick={()=>duplicateRow(idx)} className="text-xs">Duplicate</button>
                    <button onClick={()=>removeRow(idx)} className="text-xs text-red-600">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-600 mt-2">Rows: {existingLines.length} | Est. Make‑ready total: ${totalCost}</div>
      {existingLines.length ? (
        <div className="text-xs text-gray-700 mt-1">
          <div className="font-medium">By company:</div>
          <ul className="list-disc pl-5">
            {Object.entries(existingLines.reduce((acc, r)=>{
              if (!r.makeReady) return acc;
              const key = r.companyName || '—';
              acc[key] = (acc[key] || 0) + (Math.abs(Math.round(((parseFeet(r.makeReadyHeight)||0) - (parseFeet(r.height)||0))*12)) * 12.5);
              return acc;
            }, {})).map(([k,v]) => (
              <li key={k}>{k}: ${v}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <CsvMapModal open={showMapModal} onClose={()=>setShowMapModal(false)} headers={headers} mapping={csvLineMapping} onChange={setCsvLineMapping} />
    </div>
  );
}

function CsvMapModal({ open, onClose, headers, mapping, onChange }) {
  if (!open) return null;
  const keys = ['type','company','height','makeReady','makeReadyHeight'];
  const set = (k, v) => onChange({ ...mapping, [k]: v });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[90vw] max-w-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Map CSV Columns</div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm">
          {keys.map(k => (
            <label key={k} className="grid grid-cols-2 items-center gap-2">
              <span className="text-xs uppercase text-gray-500">{k}</span>
              <select className="form-input" value={mapping[k] || ''} onChange={e=>set(k,e.target.value)}>
                <option value="">—</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="text-xs text-gray-600 mt-2">Tip: set once and it’s remembered.</div>
      </div>
    </div>
  );
}
