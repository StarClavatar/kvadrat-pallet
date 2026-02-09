import { useEffect, useState, useMemo } from 'react';

// Define the interface for the native BarcodeDetector
export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

interface BarcodeDetectorOptions {
  formats: string[];
}

declare global {
  class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions);
    static getSupportedFormats(): Promise<string[]>;
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }
}

export const useBarcodeDetector = (
  formats: string[] = ['data_matrix', 'qr_code', 'code_128', 'ean_13']
) => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [detector, setDetector] = useState<BarcodeDetector | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      if (!('BarcodeDetector' in window)) {
        setIsSupported(false);
        return;
      }

      try {
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        const availableFormats = formats.filter(f => supportedFormats.includes(f));
        
        if (availableFormats.length === 0) {
          setIsSupported(false);
          return;
        }

        setDetector(new BarcodeDetector({ formats: availableFormats }));
        setIsSupported(true);
      } catch (e) {
        console.error('BarcodeDetector creation failed:', e);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, [formats]);

  return { isSupported, detector };
};
