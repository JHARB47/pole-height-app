// Manifest builder for utility export packages
// Profiles supported: 'firstEnergy', 'aep', 'duke', 'generic'

export function buildManifest(profileName, poles, job) {
  const profile = profileName || 'generic';
  const j = job || {};
  switch (profile) {
    case 'firstEnergy': {
      const header = [
        'id','latitude','longitude','height','class','powerHeight','voltage','hasTransformer','spanDistance','adjacentPoleHeight','attachmentType','status','hasPhoto','timestamp','jobId','asBuiltAttachHeight','asBuiltPowerHeight','varianceIn','variancePass','commCompany'
      ];
      const rows = poles.map(p => [
        p.id || '', p.latitude || '', p.longitude || '', p.height || '', p.poleClass || '', p.powerHeight || '', p.voltage || '', p.hasTransformer ? 'Y' : 'N', p.spanDistance || '', p.adjacentPoleHeight || '', p.attachmentType || '', (p.status || 'draft'), (p.photoDataUrl ? 'Y' : 'N'), p.timestamp || '', p.jobId || '',
        p.asBuilt?.attachHeight || '', p.asBuilt?.powerHeight || '', p._varianceIn || '', p._variancePass || '', j.commCompany || ''
      ]);
      return { header, rows, fileLabel: 'fe-spans-package' };
    }
    case 'aep': {
      const header = [
        'PoleID','Lat','Lon','PoleHtFt','Class','PowerHt','Voltage','XFMR','SpanFt','AdjPoleFt','Cable','Status','Photo','Timestamp','JobId','CommCompany'
      ];
      const rows = poles.map(p => [
        p.id||'',p.latitude||'',p.longitude||'',p.height||'',p.poleClass||'',p.powerHeight||'',p.voltage||'',p.hasTransformer?'Y':'N',p.spanDistance||'',p.adjacentPoleHeight||'',p.attachmentType||'',(p.status||'draft'),(p.photoDataUrl?'Y':'N'),p.timestamp||'',p.jobId||'', j.commCompany || ''
      ]);
      return { header, rows, fileLabel: 'aep-application-package' };
    }
    case 'duke': {
      // Duke Energy style application manifest (plausible schema)
      const header = [
        'PoleTag','Latitude','Longitude','PoleHeightFt','Class','PowerHtFt','VoltageClass','HasXFMR','SpanLengthFt','AdjPoleHtFt','Attachment','Status','PhotoIncluded','Timestamp','JobId','CommCompany'
      ];
      const rows = poles.map(p => [
        p.id||'', p.latitude||'', p.longitude||'', p.height||'', p.poleClass||'', p.powerHeight||'', p.voltage||'', p.hasTransformer?'Y':'N', p.spanDistance||'', p.adjacentPoleHeight||'', p.attachmentType||'', (p.status||'draft'), (p.photoDataUrl?'Y':'N'), p.timestamp||'', p.jobId||'', j.commCompany || ''
      ]);
      return { header, rows, fileLabel: 'duke-application-package' };
    }
    default: {
      const header = [
        'id','lat','lon','height','class','span','status','photo','jobId','commCompany'
      ];
      const rows = poles.map(p => [
        p.id||'',p.latitude||'',p.longitude||'',p.height||'',p.poleClass||'',p.spanDistance||'',(p.status||'draft'),(p.photoDataUrl?'Y':'N'),p.jobId||'', j.commCompany || ''
      ]);
      return { header, rows, fileLabel: 'utility-package' };
    }
  }
}

export function csvFrom(header, rows) {
  const safe = (v) => String(v ?? '').replaceAll('"', '""');
  return [header.join(','), ...rows.map(r => r.map(safe).join(','))].join('\n');
}
