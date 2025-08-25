import React, { Suspense, useState } from 'react';
import Help from './components/Help';

// Lazy load the main calculator component
const LazyProposedLineCalculator = React.lazy(() => import('./components/LazyProposedLineCalculator'));

const PoleHeightApplication = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading calculator...</div>
        </div>
      }>
        <LazyProposedLineCalculator />
      </Suspense>
      <Help 
        open={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
};

export default PoleHeightApplication;
