import { describe, it, expect } from 'vitest';
import { computeAnalysis, DEFAULTS } from './calculations';

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

const envs = [
  'road','residential','pedestrian','field','residentialYard','residentialDriveway','nonResidentialDriveway','waterway','wvHighway','interstate','interstateNewCrossing','railroad'
];

describe('randomized smoke: computeAnalysis resilience', () => {
  it('runs multiple times with realistic random inputs (<=60ft) without throwing', () => {
    for (let i = 0; i < 25; i++) {
      const isNew = Math.random() < 0.7; // bias towards new construction so power height can be blank
      const poleHeight = String(randInt(20, 60));
      const spanDistance = Math.random() < 0.2 ? '' : String(randInt(50, 250));
      const existingPowerHeight = isNew ? '' : `${randInt(20, 35)}' ${randInt(0, 11)}"`;
      const attachmentType = pick(DEFAULTS.cableTypes).value;
      const windSpeed = String(randInt(60, 100));
      const env = pick(envs);
      const proposedLineHeight = Math.random() < 0.3 ? '' : `${randInt(12, 35)}' ${randInt(0, 11)}"`;

      const inputs = {
        poleHeight,
        poleClass: '',
        existingPowerHeight,
        existingPowerVoltage: 'distribution',
        spanDistance,
        isNewConstruction: isNew,
        adjacentPoleHeight: '',
        attachmentType,
        cableDiameter: '',
        windSpeed,
        spanEnvironment: env,
        dripLoopHeight: '',
        proposedLineHeight,
        existingLines: [],
        iceThicknessIn: '',
        hasTransformer: false,
        presetProfile: '',
        customMinTopSpace: '',
        customRoadClearance: '',
        customCommToPower: '',
        powerReference: 'auto',
        jobOwner: '',
        submissionProfile: undefined,
      };

      const out = computeAnalysis(inputs);
      // Should either produce errors or a results object; never throw
      if (out.errors) {
        // If not new construction and power height missing, this is acceptable
        expect(out.errors).toBeTypeOf('object');
      } else {
        expect(out.results).toBeDefined();
        // sanity on key numbers
        expect(Number.isFinite(out.results.span?.spanFt ?? 0)).toBe(true);
        expect(Number.isFinite(out.results.span?.midspanFt ?? 0)).toBe(true);
        expect(Number.isFinite(out.results.attach?.proposedAttachFt ?? 0)).toBe(true);
      }
    }
  });
});
