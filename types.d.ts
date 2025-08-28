// Type declarations for external modules

declare module 'jszip' {
  export default class JSZip {
    folder(name: string): JSZip | null;
    file(name: string, data: any, options?: any): void;
    generateAsync(options: { type: 'blob' }): Promise<Blob>;
    generateAsync(options: { type: 'uint8array' }): Promise<Uint8Array>;
    generateAsync(options: { type: string }): Promise<any>;
    loadAsync(data: any): Promise<JSZip>;
    forEach(callback: (path: string, file: any) => void): void;
  }
}

declare module 'exifr' {
  interface ExifData {
    DateTimeOriginal?: string;
    CreateDate?: string;
    GPS?: {
      latitude?: number;
      longitude?: number;
    };
  }

  export default function parse(file: File | Blob, options?: { gps?: boolean }): Promise<ExifData>;
  export const parse: (file: Blob | File, options?: { gps?: boolean }) => Promise<ExifData>;
}

declare module 'zustand/react/shallow' {
  export function useShallow<T, U>(selector: (state: T) => U): (state: T) => U;
}

// Extend ImportMeta to include env
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend window for geolocation
interface Window {
  webkitURL?: typeof URL;
}
