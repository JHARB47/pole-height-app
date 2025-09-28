export function buildPolesCSV(poles?: any[], preset?: string): string;
export function buildSpansCSV(spans?: any[], preset?: string): string;
export function buildExistingLinesCSV(lines?: any[], preset?: string): string;
export function buildGeoJSON({ poles, spans }: {
    poles?: any[];
    spans?: any[];
}): {
    type: string;
    features: ({
        type: string;
        geometry: {
            type: string;
            coordinates: number[];
        };
        properties: {
            POLE_ID: any;
            HEIGHT_FT: string | number;
            CLASS: any;
            PWR_HT: string | number;
            XFMR: string;
        };
    } | {
        type: string;
        geometry: {
            type: string;
            coordinates: any;
        };
        properties: {
            SPAN_ID: any;
            FROM_ID: any;
            TO_ID: any;
            SPAN_FT: string | number;
            ATTACH_FT: string | number;
        };
    })[];
};
export function buildKML({ poles, spans }: {
    poles?: any[];
    spans?: any[];
}): string;
export function buildFirstEnergyJointUseCSV({ cachedMidspans, job }: {
    cachedMidspans?: any[];
    job?: {
        name: string;
    };
}): string;
export function sanitizeFilename(name: string): string;
export function addBOM(str: string): string;
export function buildExportBundle(options?: {
    poles?: any[];
    spans?: any[];
    existingLines?: any[];
    preset?: string;
    job?: { name: string; jobNumber: string };
    includeBOM?: boolean;
}): { base: string; files: Record<string, string> };
export const EXPORT_PRESETS: {
    label: string;
    value: string;
}[];
