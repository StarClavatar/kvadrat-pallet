import { useEffect, useState } from 'react';
import { useSymbologyScanner } from '@use-symbology-scanner/react';

type ScannerHandler = (symbol: string) => void;

/**
 * Custom hook to handle barcode scanning with a workaround for initialization on route changes.
 * @param handler - The function to call with the scanned symbol.
 * @param options - Optional configuration for the scanner.
 */
export const useCustomScanner = (handler: ScannerHandler, enabled?: boolean) => {
  // This workaround forces a re-render on component mount, which "wakes up"
  // the global scanner listener after a route change in a SPA.
  const [, setForceRender] = useState('');

  useEffect(() => {
    setForceRender(' ');
  }, []);

  useSymbologyScanner(handler, {
    enabled: enabled ?? true,
    ignoreRepeats: true,
    scannerOptions: {
      maxDelay: 100
    }
  });
}; 