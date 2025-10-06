/**
 * Build a permit summary object from core inputs.
 * @param {object} params
 * @param {'wvHighway'|'railroad'|string} params.env
 * @param {object} params.results - computeAnalysis results
 * @param {object} params.job - current job object
 * @param {object} params.effectiveProfile - merged submission profile
 * @param {Array} params.cachedMidspans - store.cachedMidspans
 * @param {object} params.store - minimal fields for metadata (optional)
 */
export function makePermitSummary({
  env,
  results,
  job,
  effectiveProfile,
  cachedMidspans,
  store,
}: {
  env: "wvHighway" | "railroad" | string;
  results: object;
  job: object;
  effectiveProfile: object;
  cachedMidspans: any[];
  store: object;
}): {
  type: string;
  job: {
    id: any;
    name: any;
    applicant: any;
    jobNumber: any;
    owner: any;
    commCompany: any;
    submissionProfileName: any;
  };
  profile: any;
  environment: string;
  pole: {
    heightFt: number;
    class: any;
    gps: {
      lat: any;
      lon: any;
    };
  };
  power: {
    voltage: any;
    heightFt: any;
  };
  span: {
    lengthFt: any;
    midspanFt: any;
    targetFt: any;
    computedGroundClearanceFt: any;
    targetSource: string;
    midLatitude: any;
    midLongitude: any;
    endpoints: {
      from: {
        id: any;
        latitude: any;
        longitude: any;
      };
      to: {
        id: any;
        latitude: any;
        longitude: any;
      };
    };
  };
  attach: {
    proposedFt: any;
    basis: any;
    detail: any;
  };
  timestamps: {
    generatedAt: string;
  };
};
