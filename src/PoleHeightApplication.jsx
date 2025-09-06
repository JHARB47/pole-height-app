import React, { Suspense, useState } from 'react';
import Help from './components/Help';
import QuickExportButtons from './components/QuickExportButtons.jsx';
import useAppStore from './utils/store.js';

// Lazy load the main calculator component
const LazyProposedLineCalculator = React.lazy(() => import('./components/LazyProposedLineCalculator'));

const PoleHeightApplication = () => {
  const [showHelp, setShowHelp] = useState(false);
  const poles = useAppStore((s) => s.collectedPoles || []);
  const spans = useAppStore((s) => s.importedSpans || []);
  const existingLines = useAppStore((s) => s.importedExistingLines || s.existingLines || []);
  const job = {
    name: useAppStore((s) => s.projectName || 'Untitled Job'),
    applicantName: useAppStore((s) => s.applicantName || ''),
    jobNumber: useAppStore((s) => s.jobNumber || ''),
  };
  const preset = useAppStore((s) => s.currentSubmissionProfile || 'generic');

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading calculator...</div>
        </div>
      }>
        <LazyProposedLineCalculator />
      </Suspense>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-end">
          <QuickExportButtons poles={poles} spans={spans} existingLines={existingLines} job={job} preset={preset} />
        </div>
      </div>
      <Help 
        open={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
};

export default PoleHeightApplication;
