import React from 'react';
import { computePullAutofill } from '@/utils/calculations.js';

export default function AutoFillPullButton({ pole, onUpdatePole, baseSpanFt = 100, className = '' }) {
  const disabled = pole == null || typeof pole !== 'object';

  const handleClick = () => {
    if (disabled) return;
    const { incomingBearingDeg, outgoingBearingDeg } = pole;
    if (typeof incomingBearingDeg !== 'number' || typeof outgoingBearingDeg !== 'number') return;
    const { pullFt } = computePullAutofill({ incomingBearingDeg, outgoingBearingDeg, baseSpanFt });
    onUpdatePole?.({ ...pole, PULL_ft: Math.round(pullFt * 100) / 100 });
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={disabled} title="Auto-fill PULL from segment bearings">
      Autofill PULL
    </button>
  );
}
