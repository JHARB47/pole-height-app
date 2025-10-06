export function importGeospatialFile(file: any): Promise<any>;
export function parseKML(text: any): Promise<any>;
export function parseKMZ(file: any): Promise<any>;
export function parseShapefile(file: any): Promise<any>;
export function splitFeaturesByGeometry(fc: any): {
  poles: any[];
  lines: any[];
  others: any[];
};
export function getAttributeKeys(feature: any): string[];
export function mapGeoJSONToAppData(
  fc: any,
  config: any,
): {
  poleTable: Array<any>;
  spanTable: Array<any>;
  existingLines: Array<any>;
};
export function parseExistingLinesCSV(csvText: any, lineMapping: any): any;
export function parsePolesCSV(csvText: any, poleMapping: any): any;
export function parseSpansCSV(csvText: any, spanMapping: any): any;
export function parsePolesCSVValidated(
  csvText: any,
  poleMapping: any,
): Promise<any>;
export function parseSpansCSVValidated(
  csvText: any,
  spanMapping: any,
): Promise<any>;
export function coerceNumber(raw: any): number | null;
export const MAPPING_PRESETS: {
  label: string;
  value: string;
  mapping: {
    pole: {
      id: string;
      height: string;
      class: string;
      powerHeight: string;
      hasTransformer: string;
      latitude: string;
      longitude: string;
    };
    span: {
      id: string;
      fromId: string;
      toId: string;
      length: string;
      proposedAttach: string;
    };
    line: {
      type: string;
      height: string;
      company: string;
      makeReady: string;
      makeReadyHeight: string;
    };
  };
}[];
