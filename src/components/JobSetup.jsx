import React from 'react';
import { WV_COMPANIES } from '../utils/constants';
import useAppStore from '../utils/store';

export default function JobSetup() {
  const store = useAppStore();
  const [name, setName] = React.useState(store.projectName || '');
  const [applicantName, setApplicantName] = React.useState(store.applicantName || '');
  const [jobNumber, setJobNumber] = React.useState(store.jobNumber || '');
  const [presetProfile, setPresetProfile] = React.useState(store.presetProfile || '');
  const [jobOwner, setJobOwner] = React.useState(store.jobOwner || '');
  const [commCompany, setCommCompany] = React.useState('');
  const [submissionProfileName, setSubmissionProfileName] = React.useState(store.currentSubmissionProfile || 'generic');
  const [overrideCommToPowerIn, setOverrideCommToPowerIn] = React.useState('');
  const [overrideMinTopSpaceFt, setOverrideMinTopSpaceFt] = React.useState('');
  const [overrideRoadClearanceFt, setOverrideRoadClearanceFt] = React.useState('');
  const [overrideEnvRoadFt, setOverrideEnvRoadFt] = React.useState('');
  const [overrideEnvResidentialFt, setOverrideEnvResidentialFt] = React.useState('');
  const [overrideEnvPedestrianFt, setOverrideEnvPedestrianFt] = React.useState('');
  const [overrideMinCommAttachFt, setOverrideMinCommAttachFt] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    setName(store.projectName || '');
    setApplicantName(store.applicantName || '');
    setJobNumber(store.jobNumber || '');
    setPresetProfile(store.presetProfile || '');
    setJobOwner(store.jobOwner || '');
    const current = (store.jobs||[]).find(j=>j.id===store.currentJobId);
    setCommCompany(current?.commCompany || '');
    setSubmissionProfileName(current?.submissionProfileName || store.currentSubmissionProfile || 'generic');
    setOverrideCommToPowerIn(String(current?.submissionProfileOverrides?.commToPowerIn ?? ''));
    setOverrideMinTopSpaceFt(String(current?.submissionProfileOverrides?.minTopSpaceFt ?? ''));
    setOverrideRoadClearanceFt(String(current?.submissionProfileOverrides?.roadClearanceFt ?? ''));
  setOverrideEnvRoadFt(String(current?.submissionProfileOverrides?.envRoadFt ?? ''));
  setOverrideEnvResidentialFt(String(current?.submissionProfileOverrides?.envResidentialFt ?? ''));
  setOverrideEnvPedestrianFt(String(current?.submissionProfileOverrides?.envPedestrianFt ?? ''));
  setOverrideMinCommAttachFt(String(current?.submissionProfileOverrides?.minCommAttachFt ?? ''));
  }, [store.projectName, store.applicantName, store.jobNumber, store.presetProfile, store.jobOwner, store.currentJobId, store.jobs, store.currentSubmissionProfile]);

  const onCreate = () => {
  store.addJob({ 
    name, applicantName, jobNumber, presetProfile, jobOwner, notes,
    commCompany,
    submissionProfileName,
    submissionProfileOverrides: {
      commToPowerIn: overrideCommToPowerIn ? Number(overrideCommToPowerIn) : undefined,
      minTopSpaceFt: overrideMinTopSpaceFt ? Number(overrideMinTopSpaceFt) : undefined,
      roadClearanceFt: overrideRoadClearanceFt ? Number(overrideRoadClearanceFt) : undefined,
  envRoadFt: overrideEnvRoadFt ? Number(overrideEnvRoadFt) : undefined,
  envResidentialFt: overrideEnvResidentialFt ? Number(overrideEnvResidentialFt) : undefined,
  envPedestrianFt: overrideEnvPedestrianFt ? Number(overrideEnvPedestrianFt) : undefined,
  minCommAttachFt: overrideMinCommAttachFt ? Number(overrideMinCommAttachFt) : undefined,
    }
  });
  };
  const onUpdate = () => {
    if (!store.currentJobId) return;
  store.updateJob(store.currentJobId, { 
    name, applicantName, jobNumber, presetProfile, jobOwner, notes,
    commCompany,
    submissionProfileName,
    submissionProfileOverrides: {
      commToPowerIn: overrideCommToPowerIn ? Number(overrideCommToPowerIn) : undefined,
      minTopSpaceFt: overrideMinTopSpaceFt ? Number(overrideMinTopSpaceFt) : undefined,
      roadClearanceFt: overrideRoadClearanceFt ? Number(overrideRoadClearanceFt) : undefined,
  envRoadFt: overrideEnvRoadFt ? Number(overrideEnvRoadFt) : undefined,
  envResidentialFt: overrideEnvResidentialFt ? Number(overrideEnvResidentialFt) : undefined,
  envPedestrianFt: overrideEnvPedestrianFt ? Number(overrideEnvPedestrianFt) : undefined,
  minCommAttachFt: overrideMinCommAttachFt ? Number(overrideMinCommAttachFt) : undefined,
    }
  });
  };
  const onDelete = () => {
    if (!store.currentJobId) return;
    if (!confirm('Delete this job?')) return;
    store.removeJob(store.currentJobId);
  };

  return (
    <div className="rounded border p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Job Setup</div>
        <div className="text-xs text-gray-600">Jobs: {(store.jobs || []).length}</div>
      </div>
  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Select Job</span>
          <div className="flex gap-2 items-center">
            <select className="border rounded px-2 py-1" value={store.currentJobId || ''} onChange={e=>store.setCurrentJobId(e.target.value)}>
              <option value="">-- None --</option>
              {(store.jobs||[]).map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <button className="text-xs px-2 py-1 border rounded" onClick={()=>store.setCurrentJobId('')}>Clear</button>
          </div>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Job Name</span>
          <input className="border rounded px-2 py-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Applicant</span>
          <input className="border rounded px-2 py-1" value={applicantName} onChange={e=>setApplicantName(e.target.value)} placeholder="Applicant name" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Job #</span>
          <input className="border rounded px-2 py-1" value={jobNumber} onChange={e=>setJobNumber(e.target.value)} placeholder="Job number" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Preset</span>
          <select className="border rounded px-2 py-1" value={presetProfile} onChange={e=>setPresetProfile(e.target.value)}>
            <option value="">default</option>
            <option value="firstEnergy">FirstEnergy</option>
            <option value="firstEnergyMonPower">FirstEnergy - Mon Power</option>
            <option value="pse">PSE</option>
            <option value="duke">Duke</option>
            <option value="nationalGrid">National Grid</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Owner (utility)</span>
          <input list="wv-power-companies" className="border rounded px-2 py-1" value={jobOwner} onChange={e=>setJobOwner(e.target.value)} placeholder="e.g., Mon Power, Penelec" />
          <datalist id="wv-power-companies">
            {WV_COMPANIES.power.map(c => <option key={c.name} value={c.short || c.name}>{c.name}</option>)}
          </datalist>
          <span className="text-xs text-gray-500">Hint: Typing a FirstEnergy subsidiary (e.g., Mon Power) enables FE 44" rules automatically.</span>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Attaching Communications Company</span>
          <input list="wv-comm-companies" className="border rounded px-2 py-1" value={commCompany} onChange={e=>setCommCompany(e.target.value)} placeholder="e.g., Frontier, Optimum" />
          <datalist id="wv-comm-companies">
            {WV_COMPANIES.communication.map(c => <option key={c.name} value={c.short || c.name}>{c.name}</option>)}
          </datalist>
        </label>

        {/* Job-level Standards/Profile */}
        <div className="sm:col-span-2 lg:col-span-4 border rounded p-2">
          <div className="font-medium text-sm mb-2">Job Standards & Export Profile</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Submission Profile</span>
              <select className="border rounded px-2 py-1" value={submissionProfileName} onChange={e=>setSubmissionProfileName(e.target.value)}>
                {(store.submissionProfiles||[]).map(p=> <option key={p.name} value={p.name}>{p.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Comm→Power (in)</span>
              <input className="border rounded px-2 py-1" value={overrideCommToPowerIn} onChange={e=>setOverrideCommToPowerIn(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Min Top Space (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideMinTopSpaceFt} onChange={e=>setOverrideMinTopSpaceFt(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Road Clearance (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideRoadClearanceFt} onChange={e=>setOverrideRoadClearanceFt(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Road Midspan Target (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideEnvRoadFt} onChange={e=>setOverrideEnvRoadFt(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Residential Midspan Target (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideEnvResidentialFt} onChange={e=>setOverrideEnvResidentialFt(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Override Pedestrian Midspan Target (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideEnvPedestrianFt} onChange={e=>setOverrideEnvPedestrianFt(e.target.value)} placeholder="blank = use profile" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Min Comm Attach Height (ft)</span>
              <input className="border rounded px-2 py-1" value={overrideMinCommAttachFt} onChange={e=>setOverrideMinCommAttachFt(e.target.value)} placeholder="blank = use profile" />
              <span className="text-xs text-gray-500">Applied after separation; will be clamped to maintain required power separation.</span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Δ Threshold for Span Length (ft)</span>
              <input
                className="border rounded px-2 py-1"
                type="number" min="0" step="1"
                value={store.spanLenDeltaThresholdFt ?? 10}
                onChange={e=>store.setSpanLenDeltaThresholdFt(e.target.value)}
              />
              <span className="text-xs text-gray-500">Used in Spans editor to highlight manual vs auto length differences.</span>
            </label>
          </div>
          <div className="text-xs text-gray-600 mt-1">Defaults follow NESC unless the Owner maps to utilities like FirstEnergy (44" separation, 18 ft road). Overrides let you tune job-specific specs.</div>
        </div>
        <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-4">
          <span className="font-medium">Notes</span>
          <textarea className="border rounded px-2 py-1" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional job notes" />
        </label>
      </div>
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={onCreate}>Create</button>
        <button className="px-3 py-1 border rounded" onClick={onUpdate} disabled={!store.currentJobId}>Update</button>
        <button className="px-3 py-1 border rounded text-red-700" onClick={onDelete} disabled={!store.currentJobId}>Delete</button>
      </div>
      {store.currentJobId ? (
        <div className="mt-2 text-xs text-gray-700">Active job: <strong>{(store.jobs||[]).find(j=>j.id===store.currentJobId)?.name}</strong> (ID: {store.currentJobId})</div>
      ) : null}
    </div>
  );
}
