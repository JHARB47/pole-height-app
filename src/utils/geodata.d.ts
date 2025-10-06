export function buildGeoJSON({
  poles,
  spans,
  job,
}?: {
  poles?: any[];
  spans?: any[];
  job?: any;
}): {
  type: string;
  features: (
    | {
        type: string;
        properties: {
          id: any;
          jobId: any;
          status: any;
          height: any;
          poleClass: any;
          powerHeight: any;
          voltage: any;
          hasTransformer: boolean;
          spanDistance: any;
          adjacentPoleHeight: any;
          attachmentType: any;
          timestamp: any;
          commCompany: any;
        };
        geometry: {
          type: string;
          coordinates: number[];
        };
      }
    | {
        type: string;
        properties: {
          id: any;
          jobId: any;
          lengthFt: any;
          proposedAttach: any;
          environment: any;
        };
        geometry: {
          type: string;
          coordinates: any[];
        };
      }
  )[];
};
export function downloadText(filename: any, text: any, type?: string): void;
export function exportGeoJSON(fc: any, filename?: string): void;
export function exportKML(fc: any, filename?: string): Promise<void>;
export function exportKMZ(fc: any, filename?: string): Promise<void>;
export function exportShapefile(
  fc: any,
  filename?: string,
  autoDownload?: boolean,
): Promise<any>;
