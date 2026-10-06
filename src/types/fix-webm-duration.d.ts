declare module 'fix-webm-duration' {
  export default function fixWebmDuration(
    blob: Blob,
    duration: number,
    callback?: (fixedBlob: Blob) => void | { logger?: false | ((msg: string) => void) },
    options?: { logger?: false | ((msg: string) => void) }
  ): Promise<Blob>;
}
