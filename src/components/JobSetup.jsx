import React from 'react';
import useAppStore from '../utils/store';

export default function JobSetup() {
  const store = useAppStore();
  const [name, setName] = React.useState(store.projectName || '');
  const [applicantName, setApplicantName] = React.useState(store.applicantName || '');
  const [jobNumber, setJobNumber] = React.useState(store.jobNumber || '');
  const [presetProfile, setPresetProfile] = React.useState(store.presetProfile || '');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    setName(store.projectName || '');
    setApplicantName(store.applicantName || '');
    setJobNumber(store.jobNumber || '');
    setPresetProfile(store.presetProfile || '');
  }, [store.projectName, store.applicantName, store.jobNumber, store.presetProfile]);

  const onCreate = () => {
    store.addJob({ name, applicantName, jobNumber, presetProfile, notes });
  };
  const onUpdate = () => {
    if (!store.currentJobId) return;
    store.updateJob(store.currentJobId, { name, applicantName, jobNumber, presetProfile, notes });
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
            <option value="pse">PSE</option>
            <option value="duke">Duke</option>
            <option value="nationalGrid">National Grid</option>
          </select>
        </label>
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
