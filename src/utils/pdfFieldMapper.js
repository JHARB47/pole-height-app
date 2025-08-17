// Map PDF AcroForm field names to normalized keys used by our fields.json
// Heuristic patterns cover common variants. Env can bias ambiguous matches.

const patterns = [
  { re: /applicant|applicant[_\s-]*name|owner[_\s-]*name|company[_\s-]*name/i, key: 'applicant' },
  { re: /project|job[_\s-]*name|work[_\s-]*description/i, key: 'jobName' },
  { re: /job[_\s-]*no|job[_\s-]*number|permit[_\s-]*no/i, key: 'jobNumber' },
  { re: /latitude|lat\b/i, key: 'poleLatitude' },
  { re: /longitude|lon\b|long\b/i, key: 'poleLongitude' },
  // Midspan and endpoint coordinates
  { re: /mid[_\s-]*span[_\s-]*lat|midpoint[_\s-]*lat/i, key: 'midLatitude' },
  { re: /mid[_\s-]*span[_\s-]*lon|mid[_\s-]*span[_\s-]*long|midpoint[_\s-]*lon|midpoint[_\s-]*long/i, key: 'midLongitude' },
  { re: /from[_\s-]*(pole)?[_\s-]*id/i, key: 'fromPoleId' },
  { re: /to[_\s-]*(pole)?[_\s-]*id/i, key: 'toPoleId' },
  { re: /from[_\s-]*lat/i, key: 'fromLatitude' },
  { re: /from[_\s-]*lon|from[_\s-]*long/i, key: 'fromLongitude' },
  { re: /to[_\s-]*lat/i, key: 'toLatitude' },
  { re: /to[_\s-]*lon|to[_\s-]*long/i, key: 'toLongitude' },
  { re: /contact|phone|tel/i, key: 'contactPhone' },
  { re: /email/i, key: 'contactEmail' },
  { re: /clearance|vertical[_\s-]*clearance|ground[_\s-]*clearance/i, key: 'targetGroundClearanceFt' },
  { re: /span[_\s-]*length|length[_\s-]*of[_\s-]*span/i, key: 'spanLengthFt' },
  { re: /mid[_\s-]*span|midspan/i, key: 'midspanFt' },
  { re: /attach|proposed[_\s-]*attach|attachment[_\s-]*height/i, key: 'proposedAttachFt' },
  { re: /owner|utility[_\s-]*owner/i, key: 'owner' },
  { re: /company|communications[_\s-]*company|comm[_\s-]*company/i, key: 'commCompany' },
  { re: /route|road|highway/i, key: 'route' },
];

export function mapFieldNameToKey(name, env) {
  if (!name) return null;
  for (const p of patterns) {
    if (p.re.test(String(name))) return p.key;
  }
  // Env-specific biases can be added here, e.g., MM-109 known names
  if (env === 'wvHighway') {
    const s = String(name).toLowerCase();
    if (s.includes('mm-109') && s.includes('applicant')) return 'applicant';
  }
  return null;
}

export default { mapFieldNameToKey };
