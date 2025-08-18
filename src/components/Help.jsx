import React from 'react';

export default function Help({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-0 md:inset-y-6 md:mx-auto md:max-w-4xl bg-white shadow-xl md:rounded-lg overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="font-semibold">Help — Pole Plan Wizard</div>
          <button className="text-sm px-2 py-1 border rounded" onClick={onClose}>Close</button>
        </div>
        <div className="px-4 md:px-6 py-3 md:py-4 max-h-[80vh] overflow-y-auto text-sm leading-6 text-gray-800 break-anywhere">
          <Section title="Getting Started">
            <ul className="list-disc pl-5">
              <li>Open Job Setup to select or create a Job (name, number, applicant, owner, submission profile).</li>
              <li>Enter baseline pole/power parameters (pole height/class, power height/voltage, environment).</li>
              <li>Use Proposed Line to compute attach height, midspan, and targets. Results update live.</li>
            </ul>
          </Section>

          <Section title="Project Management Tools">
            <ul className="list-disc pl-5">
              <li>Jobs: Create multiple jobs/projects; switch with the job selector. Each job keeps its own settings and exports.</li>
              <li>Submission Profiles: Choose utility/regional rules (e.g., FirstEnergy). Overrides per job are supported.</li>
              <li>Export Job Bundle: From Job Setup, download a ZIP snapshot (job.json, state.json, imported data, cached midspans, and logo) for sharing or backup.</li>
              <li>Duplicate & Import: Quickly duplicate a job or import a previously exported bundle to resume work.</li>
              <li>Notes & Branding: Add engineering notes and optional logo for reports.</li>
            </ul>
          </Section>

          <Section title="Permit Management Tools">
            <ul className="list-disc pl-5">
              <li>Permit Pack Export: From Proposed Line, click “Export Permit Pack” for the selected environment (WV/PA/OH/MD Highway, Railroad).</li>
              <li>Contents include: summary.json, fields.json, plan-profile.svg, issues/checklist, PCI summaries, cached midspans, QA/QC summary CSV, and draft PDFs where supported.</li>
              <li>Agency Templates: The pack includes a templates list with links to official forms/portals.</li>
              <li>PDF Autofill: Use fields.json or the built-in draft PDFs to accelerate form preparation.</li>
            </ul>
          </Section>

          <Section title="Pole & Span Data Collection">
            <ul className="list-disc pl-5">
              <li>On the Field Collection panel, capture pole ID, GPS (tap per row), heights, and photos.</li>
              <li>Photos: EXIF GPS/time are read when available to prefill coordinates and timestamps.</li>
              <li>Status: Mark rows Draft/Done; export full CSV or the first 25 rows quickly.</li>
              <li>As-built Variance: Record as-built values; PASS/FAIL follows utility tolerances.</li>
            </ul>
          </Section>

      <Section title="Spans Editor & Analytics (QA/QC)">
            <ul className="list-disc pl-5">
              <li>Import spans (From/To, lengths). Toggle “Prefer auto length” to use GPS-inferred distances when endpoints are known.</li>
              <li>Infer Endpoints: Auto-suggest nearest poles for unlabeled spans; Auto-calc/Replace lengths from GPS.</li>
              <li>Per-row quick calc shows Midspan vs Target with inline PASS/FAIL and Δ (manual vs auto).</li>
              <li>Filters: Only FAIL and Only big Δ. Threshold for Δ is configurable in the toolbar and Job Setup.</li>
        <li>Batch Actions: Compute All and Recompute All populate Cached Midspans used by Permit Pack QA/QC.</li>
              <li>Export Cached Midspans CSV, or clear them. Cached rows include coordinates, target source, PASS/deficit/Δ.</li>
            </ul>
          </Section>

      <Section title="Customizable Reports">
            <ul className="list-disc pl-5">
              <li>Batch Report and Permit Pack reflect “Prefer auto length” and Δ thresholds.</li>
        <li>Permit Pack README highlights PCI totals and a QA/QC section (span counts, PASS/FAIL, Δ buckets, sources).</li>
        <li>QA/QC summary (qa-summary.csv) provides per-span PASS/FAIL, deficit, Δ, and source for quick review or dashboards.</li>
              <li>PDF Layout Presets: Create and reuse overlay presets per job/environment for custom PDFs.</li>
            </ul>
          </Section>

          <Section title="Interop with ArcGIS, ikeGPS, and Katapult Pro">
            <ul className="list-disc pl-5">
              <li>Import panel → Mapping Preset now includes example presets for ArcGIS Hosted Feature Layers, ikeGPS, and Katapult Pro Maps.</li>
              <li>Field names vary by organization/project—use “Configure Mapping” to fine‑tune headers, then “Save Profile” for reuse.</li>
              <li>Supported formats: CSV (Poles, Spans, Existing Lines), KML/KMZ, and Shapefile (.zip). Lengths are auto‑estimated from line geometry if a length field is missing.</li>
              <li>After import, use Spans Editor to infer endpoints, prefer auto length, and Compute/Recompute All to populate Cached Midspans.</li>
              <li>Exports: Use Cached Midspans CSV and Permit Pack (README, qa-summary.csv, cached-midspans.csv) for sharing/round‑trips.</li>
              <li>Interop Export: From the export toolbar, click “Interop Export.” Choose a Preset (defaults to the Job’s Export Profile) and Format (CSV/GeoJSON/KML). CSV headers align with the selected preset.</li>
              <li>FirstEnergy note: When the preset is FirstEnergy and you’ve computed Cached Midspans, the export ZIP includes a sample FE joint‑use CSV.</li>
            </ul>
          </Section>

          <Section title="Where this app helps (Use Cases)">
            <ul className="list-disc pl-5">
              <li>OSP Engineering: Standards checks (NESC + utility overrides), segment-aware controlling targets, midspan analytics.</li>
              <li>Fiber Optic Distribution: FTTH and distribution planning, span QA, permit packaging by environment/agency.</li>
              <li>Utility Infrastructure Improvements: As-built variance tracking (PCI), make-ready indicators, consolidated reports.</li>
              <li>Field Operations: Mobile-friendly UI, per-row GPS capture, EXIF photo ingestion, quick CSV exports.</li>
              <li>Compliance & Submissions: Draft PDFs, normalized fields, and agency templates to streamline applications.</li>
            </ul>
          </Section>

          <Section title="Tips & Best Practices">
            <ul className="list-disc pl-5">
              <li>GPS accuracy improves outdoors with clear sky; tap the GPS button per row to capture fresh coordinates.</li>
              <li>Enable “Prefer auto length” when endpoints are known; use “Infer Endpoints (All)” to seed missing From/To.</li>
              <li>Use Segments to represent mixed environments across a span; targets follow the most controlling segment.</li>
              <li>Before exporting a Permit Pack, run “Recompute All” to refresh Cached Midspans for the QA/QC summary.</li>
              <li>Set Submission Profile per job (e.g., FirstEnergy) and override values if a permit requires specific tweaks.</li>
            </ul>
          </Section>

          <Section title="Workflow Cookbook (Step‑by‑Step)">
            <ol className="list-decimal pl-5">
              <li>Create or select a Job in Job Setup; choose the Submission Profile (utility/region) and set defaults.</li>
              <li>Import Poles/Spans or collect pole data in the field (GPS + photos). Mark Draft/Done as you go.</li>
              <li>In Spans Editor, infer endpoints, auto-calc lengths, and set “Prefer auto length” if GPS endpoints are known.</li>
              <li>Run “Compute All” to populate Cached Midspans. Review inline PASS/FAIL and big‑Δ badges; adjust as needed.</li>
              <li>Open Proposed Line, pick the environment (e.g., WV Highway, Railroad), and click “Export Permit Pack.”</li>
              <li>Review the pack’s README (QA/QC section and PCI totals), the qa-summary.csv, cached-midspans.csv, and draft PDFs.</li>
              <li>Use fields.json to populate agency forms if draft PDFs aren’t embedded for your environment.</li>
            </ol>
          </Section>

          <Section title="Glossary & Definitions">
            <ul className="list-disc pl-5">
              <li>Submission Profile: Set of utility/regional standards (targets, clearances) applied to analysis.</li>
              <li>Segments: Portions of a span with different environments (e.g., road 60%, residential 40%). Targets use the most controlling segment.</li>
              <li>Prefer auto length: Use GPS‑inferred distance from endpoints when available; otherwise fall back to manual/estimated.</li>
              <li>Δ (Delta): Absolute difference between manual and auto length (ft). Threshold is configurable.</li>
              <li>Cached Midspans: Saved per‑span analysis snapshots (span, midspan, target, PASS/deficit/Δ, coords) reused in exports.</li>
              <li>QA/QC: Quality Assurance/Quality Control—span‑level checks for PASS/FAIL vs. targets and reasonability of inputs.</li>
              <li>PCI: Post‑Construction Inspection—planned vs as‑built variance tracking with PASS/FAIL per owner tolerances.</li>
            </ul>
          </Section>

          <div className="mt-4 text-xs text-gray-500">Version info and environment are available in the footer of the deploy (Netlify). Node 22.x is recommended for local builds. For CSV, the app uses a robust parser that handles quoted values and embedded commas.</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      {children}
    </div>
  );
}
