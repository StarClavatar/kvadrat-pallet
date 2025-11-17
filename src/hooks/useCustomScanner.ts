import { useEffect, useState } from 'react';
import { useSymbologyScanner } from '@use-symbology-scanner/react';

type ScannerHandler = (symbol: string) => void;

type SymbologyKey = "UPC-A" | "UPC-E" | "EAN 8" | "EAN 13" | "Codabar" | "Code 11" | "Code 39" | "Code 93" | "Code 128" | "Code 25 Interleaved" | "Code 25 Industrial" | "MSI Code" | "QR Code" | "PDF417" | "Data Matrix" | "Aztec Code" | "Dot Code";

export const useCustomScanner = (handler: ScannerHandler, enabled?: boolean, ssccOnly?: boolean) => {
  const [, setForceRender] = useState('');

  useEffect(() => {
    // ВНИМАНИЕ!!!!!!!!!!!!!!!!!!
    setForceRender(' ');
    // Этот Сеттер необъходим для срабатывания слушателей клавиатурных событий с ТСД сканера
    // без него не сканируется, нужно будет только вызвать какой-то ререндер, что бы слушатели начали работать
    // я потратил гигантское количество времени и неудобств, что бы это понять. Прочитайте внимательно и используйте.
  }, []);

  const symbologies: SymbologyKey[] | undefined = ssccOnly ? ['Code 128'] : undefined;

  const internalHandler = (symbol: string) => {
    if (ssccOnly) {
      const ssccRegex = /^00\d{18}$/;
      if (ssccRegex.test(symbol)) {
        handler(symbol);
      }
      return
    }
    handler(symbol);
  };

  useSymbologyScanner(internalHandler, {
    enabled: enabled ?? true,
    ignoreRepeats: true,
    scannerOptions: {
      maxDelay: 100
    },
    symbologies,
  });
}; 