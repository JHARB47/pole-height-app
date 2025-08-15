import React, { useEffect } from 'react';
import { PoleSketch } from './PoleSketch';
import useAppStore from '../utils/store';
import {
  DEFAULTS,
  getPoleBurialData,
  getNESCClearances,
  calculateDownGuy
} from '../utils/calculations';

export default function OspApplication() {
  const {
    poleHeight, poleClass,
    existingPowerHeight, existingPowerVoltage,
    spanDistance, isNewConstruction, adjacentPoleHeight,
    attachmentType, cableDiameter, windSpeed, spanEnvironment,
    requiresGuying, proposedLineHeight,
    setResults, setWarnings, setEngineeringNotes, setGuyAnalysis
  } = useAppStore();

  useEffect(() => {
    if (!poleHeight || (!isNewConstruction && !existingPowerHeight)) {
      setResults(null);
      setWarnings([]);
      setEngineeringNotes([]);
      return;
    }

    const localWarnings = [];
    const notes = [];

    const clearances = getNESCClearances(existingPowerVoltage, spanEnvironment);
    const poleData = getPoleBurialData(Number(poleHeight), poleClass);

    if (requiresGuying) {
      const cableData = DEFAULTS.cableTypes.find(c => c.value === attachmentType) || DEFAULTS.cableTypes[0];
      const guyResults = calculateDownGuy(
        poleData.aboveGround,
        Number(proposedLineHeight) || poleData.aboveGround,
        cableData,
        Number(spanDistance) || 0,
        Number(windSpeed) || 90
      );
      setGuyAnalysis(guyResults);
      if (guyResults?.required) notes.push(`Guy required: ${Math.round(guyResults.tension)} lb`);
    }

    setResults({ poleData, clearances, notes });
    setWarnings(localWarnings);
    setEngineeringNotes(notes);
  }, [
    poleHeight, existingPowerHeight, isNewConstruction,
    spanDistance, adjacentPoleHeight, attachmentType, cableDiameter,
    windSpeed, spanEnvironment, requiresGuying, proposedLineHeight,
    setResults, setWarnings, setEngineeringNotes, setGuyAnalysis, poleClass, existingPowerVoltage
  ]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">OSP Application</h2>
      <PoleSketch />
      {/* Expand UI as needed — keep computation in effect/store */}
    </div>
  );
}