import sharp from "sharp";

export const maximumEvidenceBytes = 8 * 1024 * 1024;
const maximumImagePixels = 25_000_000;
const maximumImageDimension = 8000;

export async function normalizeEvidenceImage(input: Buffer): Promise<Buffer> {
  if (input.length === 0 || input.length > maximumEvidenceBytes) {
    throw new Error("Invalid image size");
  }

  const imageOptions = {
    limitInputPixels: maximumImagePixels,
    failOn: "error" as const,
  };
  const metadata = await sharp(input, imageOptions).metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error("Unsupported image format");
  }
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > maximumImageDimension ||
    metadata.height > maximumImageDimension ||
    (metadata.pages ?? 1) > 1
  ) {
    throw new Error("Unsupported image dimensions");
  }

  const normalized = await sharp(input, imageOptions)
    .rotate()
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  if (normalized.length > maximumEvidenceBytes) {
    throw new Error("Normalized image is too large");
  }

  return normalized;
}
