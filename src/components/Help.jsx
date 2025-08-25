import React from 'react';

/**
 * Help documentation component that provides comprehensive guidance
 * for using the Pole Height Application
 */
export function HelpModal({ open, onClose, initialSection }) {
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto break-anywhere">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Application Use Directions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Rules & Suggestions (Global + by Area) */}
          <section>
            <h3 className="text-lg font-semibold text-blue-800 mb-3">📐 Rules & Suggestions (How to use this tool effectively)</h3>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-medium mb-1">Global</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Data auto‑saves locally as you type. The section "Save" buttons record a timestamp for your reference.</li>
                  <li>Opening links uses a new tab so you don't lose work. Downloads are generated in‑browser; no data leaves your device unless you export.</li>
                  <li>Use the sticky workflow nav to jump between sections; collapsed sections still retain their data.</li>
                  <li>Height inputs accept tick marks (15' 6") or verbose (15ft 6in). Prefer consistent formatting per job.</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Job Setup</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pick a Submission Profile before running reports; FE subsidiaries enable 44" comm‑to‑power rules.</li>
                    <li>Set power reference (Neutral/Secondary/Drip Loop/Power) to align with field conditions.</li>
                    <li>Use the Profile Tuner to adjust targets when a permit requires specific values.</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Import & Map</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Map headers using presets for ArcGIS/ikeGPS/Katapult Pro; save your mapping for reuse.</li>
                    <li>Spans with endpoints get auto lengths (Haversine). If no field length is present, geometry is used.</li>
                    <li>KML/KMZ/Shapefile: ensure coordinates are WGS84 (EPSG:4326) for best results.</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Spans Editor</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Prefer Auto Length uses endpoints first; manual length is a fallback when auto is missing.</li>
                    <li>Δ (delta) = |manual − auto|. Default big‑Δ threshold is 10 ft (configurable).</li>
                    <li>Compute/Recompute All refreshes Cached Midspans used by Batch Report and Permit Pack.</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Existing Lines</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use Make‑Ready only when vertical moves are intended; enter new heights to estimate costs.</li>
                    <li>Keep owner/company filled for downstream cost allocation and submission artifacts.</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Field Collection</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tap GPS per row to capture fresh coordinates; EXIF from photos augments GPS/time when available.</li>
                    <li>Mark DONE only after verifying ID, GPS, and key heights; use filters to review Drafts/FAILs.</li>
                    <li>First 25 export is optimized for utilities like FirstEnergy SPANS.</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1">Results & Exports</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>PASS/FAIL badges compare midspan or separations to the controlling target (segment‑aware).</li>
                    <li>Permit Pack requires Cached Midspans for QA/QC summaries; run Recompute All beforehand.</li>
                    <li>Include Photos option packs images alongside manifests when generating utility ZIPs.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded">
                <h4 className="font-medium mb-1">Calculations & Assumptions</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sag uses a parabolic approximation with wind/ice factors from your inputs and cable type.</li>
                  <li>Midspan = average attach − sag. Ground target derives from Submission Profile + segments.</li>
                  <li>As‑built variance tolerance defaults to 2 in unless overridden by the profile/owner.</li>
                  <li>Auto length uses Haversine over WGS84; results are rounded to whole feet for readability.</li>
                  <li>Guy guidance is advisory and based on tension thresholds; confirm with utility standards.</li>
                </ul>
              </div>

              <div className="bg-emerald-50 p-3 rounded">
                <h4 className="font-medium mb-1">Accessibility & Reliability</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Large touch targets and compact headers keep actions reachable on mobile.</li>
                  <li>App is a PWA; basic offline caching applies. Very large images can affect memory on older devices.</li>
                  <li>Use new‑tab links for external resources to avoid accidental navigation away from the app.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">🚀 Quick Start Guide</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Create/Select a Job:</strong> Use the Job Setup panel to create a job (name, applicant, job #, preset, Owner). Select it to make it active.</li>
                <li><strong>Enter Basic Data:</strong> Project name, pole height, and existing conditions</li>
                <li><strong>Select Construction Type:</strong> New construction or existing pole attachment</li>
                <li><strong>Add Span Information:</strong> Distance, adjacent pole height, wind conditions</li>
                <li><strong>Use GPS (optional):</strong> Tap "GPS" beside Latitude/Longitude to autofill device coordinates</li>
                <li><strong>Configure Existing Lines:</strong> Add communication and power lines on the pole</li>
                <li><strong>Field Collection (mobile):</strong> For each pole, set ID, tap GPS, attach a photo (Camera/Library), then <em>Save Draft</em> or <em>DONE</em></li>
                <li><strong>Review Results:</strong> Check clearances, make-ready requirements, and cost estimates</li>
                <li><strong>Export:</strong> Use Export CSV, or for utility batches use "Export First 25"</li>
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
                  <li><strong>Note:</strong> Photos aren't embedded in the CSV; only a <em>hasPhoto</em> flag is included</li>
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
                  <p><strong>CSV:</strong> Paste data for <em>Poles</em>, <em>Spans</em>, or <em>Existing Lines</em> in the Import panel (headers can be mapped via presets or custom profiles)</p>
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

/**
 * Simple Help button component that can be placed anywhere in the app
 * to trigger the help modal with an optional specific section to open
 */
export function HelpButton({ section, label = "Help" }) {
  const [showHelp, setShowHelp] = React.useState(false);
  
  return (
    <>
      <button
        className="px-2 py-1 text-xs border border-blue-300 rounded text-blue-700 hover:bg-blue-50"
        onClick={() => setShowHelp(true)}
      >
        {label}
      </button>
      <HelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        initialSection={section}
      />
    </>
  );
}

/**
 * Context-specific help trigger that jumps directly to a specific help section
 */
export function ContextHelp({ section, children }) {
  const [showHelp, setShowHelp] = React.useState(false);
  
  return (
    <>
      <span onClick={() => setShowHelp(true)} className="cursor-help text-blue-600 hover:underline">
        {children}
      </span>
      <HelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        initialSection={section}
      />
    </>
  );
}

export default {
  HelpModal,
  HelpButton,
  ContextHelp
};
