export declare function clamp(value: number, min: number, max: number): number;
export declare function degToRad(deg: number): number;
export declare function radToDeg(rad: number): number;
export declare function normalizeBearingDeg(bearing: number): number;
export declare function normalizeIncludedAngleDeg(bearingA: number, bearingB: number): number;
export declare function pullFromAngleDeg(thetaDeg: number, baseSpanFt?: number): number;
export declare function angleDegFromPull(pullFt: number, baseSpanFt?: number): number;
export declare function computePullAutofill(args: { incomingBearingDeg: number; outgoingBearingDeg: number; baseSpanFt?: number; }): { thetaDeg: number; pullFt: number };
export declare const examples: {
  zero: number;
  sixty: number;
  oneTwenty: number;
  oneEighty: number;
};
export function parseFeet(value: any): number;
export function formatFeetInches(feet: any, { compact, tickMarks }?: {
    compact?: boolean;
    tickMarks?: boolean;
}): string;
export function formatFeetInchesTickMarks(feet: any): string;
export function formatFeetInchesVerbose(feet: any): string;
export function getNESCClearances(voltage?: string, environment?: string): any;
export function applyPresetToClearances(clearances: any, presetKey: any): any;
export function applyPresetObject(clearances: any, presetObj: any): any;
export function resultsToCSV(results: any, warnings?: any[], makeReadyNotes?: string, { useTickMarks }?: {
    useTickMarks?: boolean;
}): string;
export function getPoleBurialData(height: any, poleClass?: string): {
    buried: number;
    aboveGround: number;
    classInfo: string;
    recommendedClass: string;
};
export function calculateSag(spanFt: any, weightLbsPerFt: any, tensionLbs: any, windSpeedMph?: number, cableDiameterIn?: number, iceThicknessIn?: number): number;
export function calculateDownGuy(poleAboveGroundFt: any, attachmentHeightFt: any, cableData: any, spanLengthFt: any, windSpeedMph?: number, pullDirectionDeg?: number): {
    required: boolean;
    tension: number;
    angle: number;
    leadDistance: number;
    guyHeight: number;
    pullDirection: number;
    totalCost: number;
};
export function analyzeMakeReadyImpact(existingFt: any, proposedFt: any, minSeparationFt: any): {
    makeReadyRequired: boolean;
    adjustmentNeeded: number;
    recommendedHeight: number;
};
export function recommendPoleReplacement(poleHeightFt: any, requiredAboveGroundFt: any): {
    replace: boolean;
    suggestedHeight: number;
};
export function getFirstEnergyRequirements(): {
    applicationRequirements: string[];
    prohibitedItems: string[];
    engineeringChecks: string[];
    makeReadyProcess: string[];
};
export function computeAnalysis(inputs: any): {
    errors: {
        poleHeight: string;
        existingPowerHeight: string;
    };
    results?: undefined;
    warnings?: undefined;
    notes?: undefined;
    cost?: undefined;
} | {
    results: {
        pole: {
            inputHeight: number;
            buriedFt: number;
            aboveGroundFt: number;
            classInfo: string;
            latitude: any;
            longitude: any;
        };
        attach: {
            proposedAttachFt: number;
            proposedAttachFmt: string;
            recommendation: {
                basis: string;
                detail: string;
                clearanceIn: number;
                controlling: any;
            };
        };
        span: {
            spanFt: number;
            wind: number;
            sagFt: number;
            sagFmt: string;
            midspanFt: number;
            midspanFmt: string;
        };
        clearances: any;
        makeReadyTotal: number;
        guy: {
            required: boolean;
            tension: number;
            angle: number;
            leadDistance: number;
            guyHeight: number;
            pullDirection: number;
            totalCost: number;
        };
    };
    warnings: string[];
    notes: string[];
    cost: number;
    errors?: undefined;
};
export namespace DEFAULTS {
    let cableTypes: {
        label: string;
        value: string;
        weight: number;
        tension: number;
        diameter: number;
    }[];
    namespace presets {
        namespace firstEnergy {
            let label: string;
            let value: string;
            let voltage: string;
            let minTopSpace: number;
            let roadClearance: number;
            let commToPower: number;
            namespace asBuiltTolerances {
                let attachHeightIn: number;
            }
        }
        namespace firstEnergyMonPower {
            let label_1: string;
            export { label_1 as label };
            let value_1: string;
            export { value_1 as value };
            let voltage_1: string;
            export { voltage_1 as voltage };
            let minTopSpace_1: number;
            export { minTopSpace_1 as minTopSpace };
            let roadClearance_1: number;
            export { roadClearance_1 as roadClearance };
            let commToPower_1: number;
            export { commToPower_1 as commToPower };
            export namespace asBuiltTolerances_1 {
                let attachHeightIn_1: number;
                export { attachHeightIn_1 as attachHeightIn };
            }
            export { asBuiltTolerances_1 as asBuiltTolerances };
        }
        namespace pse {
            let label_2: string;
            export { label_2 as label };
            let value_2: string;
            export { value_2 as value };
            let voltage_2: string;
            export { voltage_2 as voltage };
            let minTopSpace_2: number;
            export { minTopSpace_2 as minTopSpace };
            let roadClearance_2: number;
            export { roadClearance_2 as roadClearance };
            let commToPower_2: number;
            export { commToPower_2 as commToPower };
            export namespace asBuiltTolerances_2 {
                let attachHeightIn_2: number;
                export { attachHeightIn_2 as attachHeightIn };
            }
            export { asBuiltTolerances_2 as asBuiltTolerances };
        }
        namespace duke {
            let label_3: string;
            export { label_3 as label };
            let value_3: string;
            export { value_3 as value };
            let voltage_3: string;
            export { voltage_3 as voltage };
            let minTopSpace_3: number;
            export { minTopSpace_3 as minTopSpace };
            let roadClearance_3: number;
            export { roadClearance_3 as roadClearance };
            let commToPower_3: number;
            export { commToPower_3 as commToPower };
            export namespace asBuiltTolerances_3 {
                let attachHeightIn_3: number;
                export { attachHeightIn_3 as attachHeightIn };
            }
            export { asBuiltTolerances_3 as asBuiltTolerances };
        }
        namespace nationalGrid {
            let label_4: string;
            export { label_4 as label };
            let value_4: string;
            export { value_4 as value };
            let voltage_4: string;
            export { voltage_4 as voltage };
            let minTopSpace_4: number;
            export { minTopSpace_4 as minTopSpace };
            let roadClearance_4: number;
            export { roadClearance_4 as roadClearance };
            let commToPower_4: number;
            export { commToPower_4 as commToPower };
            export namespace asBuiltTolerances_4 {
                let attachHeightIn_4: number;
                export { attachHeightIn_4 as attachHeightIn };
            }
            export { asBuiltTolerances_4 as asBuiltTolerances };
        }
    }
}
export const FIRST_ENERGY_OWNER_HINTS: string[];
