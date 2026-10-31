// Gravação de tela das métricas: limites e conferência do arquivo.
// Usado no navegador (antes de enviar) e no servidor (depois do envio).

export const recordingBucket = "metric-recordings";
// 50 MB: limite por arquivo do plano gratuito do Supabase.
export const maximumRecordingBytes = 50 * 1024 * 1024;
export const minimumRecordingSeconds = 10;
export const maximumRecordingSeconds = 180;
export const recordingTypes = ["video/mp4", "video/quicktime"] as const;
export type RecordingType = (typeof recordingTypes)[number];

export const recordingPathPattern =
  /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.(mp4|mov)$/;

export function recordingExtension(type: RecordingType) {
  return type === "video/quicktime" ? "mov" : "mp4";
}

// MP4 e MOV usam o mesmo formato de caixas (ISO BMFF). A primeira caixa
// precisa ser "ftyp" (MP4) ou, em MOVs antigos, "wide"/"moov"/"mdat".
export function detectRecordingType(bytes: Uint8Array): RecordingType | null {
  if (bytes.length < 12) return null;
  const type = String.fromCharCode(...bytes.subarray(4, 8));
  if (type === "ftyp") {
    const brand = String.fromCharCode(...bytes.subarray(8, 12));
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (["wide", "moov", "mdat", "free"].includes(type)) return "video/quicktime";
  return null;
}

// Duração em segundos lida da caixa "mvhd" (dentro de "moov"). Devolve null
// se o arquivo não tiver essa informação legível.
export function readRecordingDuration(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  function findBox(start: number, end: number, name: string): [number, number] | null {
    let offset = start;
    while (offset + 8 <= end) {
      let size = view.getUint32(offset);
      const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) return null;
        const large = view.getBigUint64(offset + 8);
        if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
        size = Number(large);
        header = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < header || offset + size > end) return null;
      if (type === name) return [offset + header, offset + size];
      offset += size;
    }
    return null;
  }

  const moov = findBox(0, bytes.length, "moov");
  if (!moov) return null;
  const mvhd = findBox(moov[0], moov[1], "mvhd");
  if (!mvhd) return null;
  const [start, end] = mvhd;
  if (start + 4 > end) return null;
  const versionByte = view.getUint8(start);
  let timescale: number;
  let duration: number;
  if (versionByte === 1) {
    if (start + 32 > end) return null;
    timescale = view.getUint32(start + 20);
    const long = view.getBigUint64(start + 24);
    if (long > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    duration = Number(long);
  } else {
    if (start + 20 > end) return null;
    timescale = view.getUint32(start + 12);
    duration = view.getUint32(start + 16);
  }
  if (!timescale || !duration) return null;
  return duration / timescale;
}
