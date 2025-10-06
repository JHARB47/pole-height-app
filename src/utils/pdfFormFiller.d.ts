export function fillPdfWithFields(
  basePdfBytes: any,
  fields: any,
  layout: any,
): Promise<Uint8Array<ArrayBufferLike>>;
export function fillAcroFormByName(
  basePdfBytes: any,
  env: any,
  fields: any,
): Promise<Uint8Array<ArrayBufferLike>>;
export function getPdfMeta(basePdfBytes: any): Promise<{
  pages: number;
  firstPage: {
    width: number;
    height: number;
  };
}>;
export function fillPdfAuto(
  basePdfBytes: any,
  env: any,
  fields: any,
  explicitLayout: any,
): Promise<Uint8Array<ArrayBufferLike>>;
declare namespace _default {
  export { fillPdfWithFields };
  export { fillAcroFormByName };
  export { getPdfMeta };
  export { fillPdfAuto };
}
export default _default;
