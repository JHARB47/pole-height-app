import React, { Suspense } from "react";

// Lazy load the heavy ProposedLineCalculator component
const ProposedLineCalculator = React.lazy(
  () => import("./ProposedLineCalculator"),
);

// Loading fallback component
function CalculatorLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading calculator...</span>
    </div>
  );
}

// Wrapper component with Suspense that forwards all props
export default function LazyProposedLineCalculator(props) {
  return (
    <Suspense fallback={<CalculatorLoading />}>
      <ProposedLineCalculator {...props} />
    </Suspense>
  );
}
