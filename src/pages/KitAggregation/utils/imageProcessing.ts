import { readBarcodes, ReadResult, ReaderOptions } from "zxing-wasm/reader";
import { GetDocResponse } from "../../../api/kitservice/getDoc";

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
  targetTotal: number,
  docData: GetDocResponse | undefined // Need full doc data for counts validation
): Promise<ScanResultData> => {
  // Calculate how many we still need
  // const currentCount = existingCodes.length;
  // const neededCount = Math.max(1, targetTotal - currentCount);

  // 1. Load Image
  let imageSource: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;

  try {
    if (typeof createImageBitmap !== 'undefined') {
      imageSource = await createImageBitmap(file);
      width = imageSource.width;
      height = imageSource.height;
    } else {
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

  // 3. Draw Image
  ctx.drawImage(imageSource, 0, 0);

  // 4. Get ImageData for scanning
  const imageData = ctx.getImageData(0, 0, width, height);

  // 5. Read barcodes
  const readerOptions: ReaderOptions = {
    tryHarder: true,
    formats: ["DataMatrix"],
    maxNumberOfSymbols: targetTotal + 5, // Allow finding more to filter them later
  };

  let results: ReadResult[] = [];
  try {
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

    // Validation Logic
    let isValid = false;
    let isRed = false;

    // 1. Check GTIN existence
    const matchedItem = docData?.kitDetail?.find(d => text.includes(d.GTIN));
    
    if (matchedItem) {
        // Validation simplified: Allow duplicates, let backend handle errors
        isValid = true;
        newCodes.push(text);
    } else {
        // Invalid GTIN
        isRed = true;
    }

    const { topLeft, topRight, bottomRight, bottomLeft } = result.position;

    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();

    // Dynamic line width
    ctx.lineWidth = Math.max(5, width / 150);

    if (isRed) {
        ctx.strokeStyle = "#f44336"; // Red for invalid GTIN or Limit Exceeded
    } else if (!isValid) {
        // Should not happen with new logic unless logic changes
        ctx.strokeStyle = "#FFD700"; 
    } else {
        ctx.strokeStyle = "#32CD32"; // LimeGreen for accepted new codes
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
