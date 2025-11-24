import { readBarcodes, ReadResult, ReaderOptions } from "zxing-wasm/reader";

export interface ScanResultData {
  processedImage: string; // Base64 image with boxes
  foundCodes: string[];
  newCodes: string[];
  duplicateCodes: string[];
  totalFound: number;
}

export const processScanImage = async (
  file: File,
  existingCodes: string[],
  targetTotal: number
): Promise<ScanResultData> => {
  // Calculate how many we still need
  const currentCount = existingCodes.length;
  const neededCount = Math.max(1, targetTotal - currentCount);

  // 1. Load Image safely handling EXIF orientation via createImageBitmap if supported
  // This ensures the image is rotated correctly before we process it or draw it.
  let imageSource: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;

  try {
    if (typeof createImageBitmap !== 'undefined') {
      imageSource = await createImageBitmap(file);
      width = imageSource.width;
      height = imageSource.height;
    } else {
      // Fallback for older browsers (less likely to handle EXIF correctly automatically, but best effort)
      const img = await loadImage(file);
      imageSource = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
    }
  } catch (e) {
    console.error("Error loading image:", e);
    throw new Error("Failed to load image");
  }

  // 2. Prepare Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // 3. Draw Image (baking in the orientation)
  ctx.drawImage(imageSource, 0, 0);

  // 4. Get ImageData for scanning
  // This ensures zxing sees exactly what we drew (pixel-for-pixel)
  const imageData = ctx.getImageData(0, 0, width, height);

  // 5. Read barcodes from the ImageData
  const readerOptions: ReaderOptions = {
    tryHarder: true,
    formats: ["DataMatrix"],
    maxNumberOfSymbols: neededCount, // Строгий лимит на основе оставшихся слотов
  };

  let results: ReadResult[] = [];
  try {
    // Note: zxing-wasm readBarcodes(imageData) works with the pixel data
    results = await readBarcodes(imageData, readerOptions);
  } catch (e) {
    console.error("Error reading barcodes:", e);
  }

  // 6. Process Results and Draw Boxes
  const foundCodes: string[] = [];
  const newCodes: string[] = [];
  const duplicateCodes: string[] = [];

  results.forEach((result) => {
    const text = result.text.trim().replace(/\((00|01|21|93)\)/g, "$1");
    foundCodes.push(text);

    // Check against global existing codes
    const isGlobalDuplicate = existingCodes.includes(text);
    // Check against current batch (duplicates within the same photo)
    const isBatchDuplicate = newCodes.includes(text);

    if (isGlobalDuplicate || isBatchDuplicate) {
      duplicateCodes.push(text);
    } else {
      newCodes.push(text);
    }

    const { topLeft, topRight, bottomRight, bottomLeft } = result.position;

    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();

    // Dynamic line width based on image size
    ctx.lineWidth = Math.max(5, width / 150);

    if (isGlobalDuplicate || isBatchDuplicate) {
      ctx.strokeStyle = "#FFD700"; // Gold for duplicates
    } else {
      ctx.strokeStyle = "#32CD32"; // LimeGreen for new
    }

    ctx.stroke();
  });

  return {
    processedImage: canvas.toDataURL("image/jpeg", 0.8),
    foundCodes,
    newCodes,
    duplicateCodes,
    totalFound: results.length,
  };
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};
