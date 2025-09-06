import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { downloadExportZip, buildKMZ, downloadFile, sanitizeFilename } from '../utils/exporters.js';

export default function QuickExportButtons({ poles, spans, existingLines, job, preset = 'generic' }) {
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const countPoles = Array.isArray(poles) ? poles.length : 0;
  const countSpans = Array.isArray(spans) ? spans.length : 0;
  const countLines = Array.isArray(existingLines) ? existingLines.length : 0;
  const hasData = (countPoles + countSpans + countLines) > 0;
  const onExport = async () => {
    setBusy(true);
    setPercent(0);
    try {
      await downloadExportZip({ poles, spans, existingLines, job, preset, includeBOM: true, onProgress: (p) => setPercent(Math.round(p)) });
    } finally {
      setBusy(false);
      setPercent(100);
      setTimeout(() => setPercent(0), 800);
    }
  };
  const onKmz = async () => {
    setBusy(true);
    try {
      const blob = await buildKMZ({ poles, spans, name: job?.name || 'export' });
      const name = sanitizeFilename([job?.jobNumber, job?.name || 'export'].filter(Boolean).join('-')) || 'export';
      downloadFile(blob, `${name}.kmz`, 'application/vnd.google-earth.kmz');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onExport}
  disabled={busy || !hasData}
        className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
  aria-busy={busy}
  aria-disabled={busy || !hasData}
  title={!hasData ? 'No data to export yet' : 'Download CSV, GeoJSON, KML, and KMZ as a ZIP bundle'}
      >
        {busy ? (percent ? `Preparing… ${percent}%` : 'Preparing…') : 'Export Bundle (ZIP)'}
      </button>
      <button
        type="button"
        onClick={onKmz}
  disabled={busy || !hasData}
        className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
  aria-disabled={busy || !hasData}
  title={!hasData ? 'No data to export yet' : 'Download KMZ for Google Earth and similar tools'}
      >
        KMZ Only
      </button>
    </div>
  );
}

QuickExportButtons.propTypes = {
  poles: PropTypes.array,
  spans: PropTypes.array,
  existingLines: PropTypes.array,
  job: PropTypes.object,
  preset: PropTypes.string,
};
