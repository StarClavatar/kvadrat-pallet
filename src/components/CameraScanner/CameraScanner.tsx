import { useState, useRef, useEffect } from "react";
import { readBarcodes, ReaderOptions, type ReadResult } from "zxing-wasm/reader";
import successSound from "../../assets/scanSuccess.mp3";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import styles from "./CameraScanner.module.css";

interface CameraScannerProps {
  onScan: (results: string[]) => void;
  className?: string;
  textButton?: string|JSX.Element;
  expectedCount?: number;
  iconWidth?: number;
  iconHeight?: number;
  existingCodes?: string[];
  targetTotal?: number;
  formats?: ReaderOptions["formats"];
  closeOnScan?: boolean;
  scannerText?: string;
  validateCode?: (code: string) => boolean;
  defaultOpen?: boolean;
  buttonHeight?: number;
  buttonDisabled?: boolean;
}

const CameraScanner = ({
  onScan,
  className,
  textButton,
  expectedCount = 1,
  buttonDisabled = false,
  iconWidth = 24,
  iconHeight = 24,
  existingCodes = [],
  // targetTotal is unused in this simplified version but kept for prop interface compatibility
  formats = ["DataMatrix", "QRCode"],
  closeOnScan = false,
  scannerText,
  validateCode,
  buttonHeight = 30,
  defaultOpen = false
}: CameraScannerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(defaultOpen);
  const [scanResult, setScanResult] = useState<{ texts: string[]; image: string; newCount: number; dupCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const successAudio = new Audio(successSound);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastScanTimeRef = useRef<number>(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  // --- Helpers ---
  const cleanCode = (text: string) => text.trim().replace(/\((00|01|21|93)\)/g, "$1");

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  };

  const toggleTorch = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      //@ts-ignore
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        } as any).then(() => {
          setTorchEnabled(!torchEnabled);
        }).catch(err => console.error("Torch error:", err));
      }
    }
  };

  const startCamera = async () => {
    setError(null);
    setScanResult(null);
    setTorchEnabled(false); // Reset torch state on start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          requestRef.current = requestAnimationFrame(scanFrame);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Не удалось получить доступ к камере.");
    }
  };

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      // Try to turn off torch before stopping track
      if (track && torchEnabled) {
          track.applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
      }
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    setTorchEnabled(false);
  };

  const handleClose = () => {
    stopCamera();
    setIsModalOpen(false);
    setScanResult(null);
    setError(null);
    setToastMessage(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  };

  // --- Drawing & Scanning ---
  const drawOverlay = (barcodes: ReadResult[], video: HTMLVideoElement, container: HTMLElement) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: cw, height: ch } = container.getBoundingClientRect();
    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const displayScale = Math.min(cw / vw, ch / vh);
    const scaledW = vw * displayScale;
    const processingScale = 720 / vh;
    const offsetX = (cw - scaledW) / 2;
    const offsetY = (ch - (vh * displayScale)) / 2;

    const currentBatchCodes: string[] = [];

    barcodes.forEach((b) => {
      const text = cleanCode(b.text);
      const isValid = validateCode ? validateCode(text) : true;
      const isGlobalDuplicate = existingCodes.includes(text);
      const isBatchDuplicate = currentBatchCodes.includes(text);
      if (!isBatchDuplicate) currentBatchCodes.push(text);

      const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = b.position;
      const tf = (p: { x: number; y: number }) => ({
        x: (p.x / processingScale) * displayScale + offsetX,
        y: (p.y / processingScale) * displayScale + offsetY,
      });

      const pt = [tf(tl), tf(tr), tf(br), tf(bl)];

      ctx.beginPath();
      ctx.moveTo(pt[0].x, pt[0].y);
      ctx.lineTo(pt[1].x, pt[1].y);
      ctx.lineTo(pt[2].x, pt[2].y);
      ctx.lineTo(pt[3].x, pt[3].y);
      ctx.closePath();

      if (!isValid) ctx.strokeStyle = "#f44336";
      else if (isGlobalDuplicate || isBatchDuplicate) ctx.strokeStyle = "#FFD700";
      else ctx.strokeStyle = "#4caf50";

      ctx.lineWidth = 4;
      ctx.stroke();
    });
  };

  const drawBarcodeOnCanvas = (_barcodes: ReadResult[], source: any, container: HTMLElement) => {
    // _barcodes are unused for simplified drawing, but kept in signature for compatibility or future overlay drawing
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    let sw, sh;
    if (source instanceof HTMLVideoElement) { sw = source.videoWidth; sh = source.videoHeight; }
    else if (source instanceof ImageBitmap) { sw = source.width; sh = source.height; }
    else { sw = source.naturalWidth; sh = source.naturalHeight; }

    const { width: cw, height: ch } = container.getBoundingClientRect();
    const scale = Math.min(cw / sw, ch / sh);
    const scaledW = sw * scale;
    const scaledH = sh * scale;
    const offsetX = (cw - scaledW) / 2;
    const offsetY = (ch - scaledH) / 2;

    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH);

    // Draw simplified boxes for snapshot (no complex coordinate mapping needed as we just drew the image)
    // Note: This logic assumes source was processed at full res, but for video we process at 720p. 
    // Ideally we should redraw boxes accurately, but for snapshot preview this is often acceptable or skipped.
    // For critical accuracy we would need to pass original coordinates.
    // Simplifying for now: Just return the image.
    return canvas.toDataURL("image/jpeg");
  };

  const scanFrame = async () => {
    const container = videoRef.current?.parentElement;
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || !container) return;

    const now = performance.now();
    if (now - lastScanTimeRef.current < 30) {
      requestRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    lastScanTimeRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Downscale to 720p height
      const scale = 720 / video.videoHeight;
      const w = video.videoWidth * scale;
      const h = 720;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);

      try {
        const results = await readBarcodes(ctx.getImageData(0, 0, w, h), {
          maxNumberOfSymbols: expectedCount,
          formats: formats,
          tryHarder: true
        });

        if (results.length > 0) {
          drawOverlay(results, video, container);

          // Validation Logic
          let validResults = results;
          if (validateCode) {
            const valid = results.filter(r => validateCode!(cleanCode(r.text)));
            if (valid.length < results.length && !toastMessage) showToast("GTIN товара не найден в заказе");
            validResults = valid;
          }

          const validTexts = validResults.map(r => cleanCode(r.text));

          if (validTexts.length >= expectedCount) {
            const finalTexts = validTexts.slice(0, expectedCount);
            const img = drawBarcodeOnCanvas(results, video, container);
            stopCamera();
            successAudio.play();

            if (closeOnScan) {
              onScan(finalTexts);
              handleClose();
              return;
            }

            if (img) {
              setScanResult({ texts: finalTexts, image: img, newCount: finalTexts.length, dupCount: 0 });
            }
            return;
          }
        } else {
          // Clear overlay
          const oCtx = overlayCanvasRef.current?.getContext('2d');
          if (oCtx) oCtx.clearRect(0, 0, overlayCanvasRef.current!.width, overlayCanvasRef.current!.height);
        }
      } catch (e) { /* ignore */ }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera(); setError(null); setScanResult(null);

    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const results = await readBarcodes(ctx!.getImageData(0, 0, canvas.width, canvas.height), {
        maxNumberOfSymbols: expectedCount, formats: ["DataMatrix", "QRCode"], tryHarder: true
      });

      if (results.length > 0) {
        const texts = results.map(r => cleanCode(r.text));
        if (validateCode) {
          if (texts.some(t => !validateCode(t))) {
            alert("Найдены товары, не соответствующие набору.");
            startCamera(); return;
          }
        }
        if (closeOnScan) { onScan(texts); handleClose(); return; }

        const container = canvasRef.current?.parentElement;
        if (container) {
          const snapshot = drawBarcodeOnCanvas(results, img, container);
          successAudio.play();
          if (snapshot) setScanResult({ texts, image: snapshot, newCount: texts.length, dupCount: 0 });
        }
      } else {
        alert("Коды не найдены."); startCamera();
      }
    } catch (e) {
      console.error(e); alert("Ошибка сканирования файла."); startCamera();
    }
  };

  useEffect(() => {
    if (isModalOpen) startCamera();
    else stopCamera();
    return stopCamera;
  }, [isModalOpen]);

  return (
    <>
      <button type="button" 
        onClick={() => setIsModalOpen(true)} 
        className={`${styles.scanButton} ${className || ""}`}
        disabled={buttonDisabled}
        >
        {textButton ? <span style={{ display: "flex", alignItems: "center", gap: "10px", height: buttonHeight + 'px' }}>{textButton} <BarCodeIcon width={iconWidth} height={iconHeight} /></span> : <BarCodeIcon width={iconWidth} height={iconHeight} />}
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          {scannerText && <h4 className={styles.modalTitle}>{scannerText}</h4>}
          <div className={styles.modalContent}>
            <button type="button" className={styles.closeButton} onClick={handleClose}>&times;</button>
            {error && <p className={styles.errorText}>{error}</p>}
            {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

            <div className={styles.scannerContainer}>
              {!scanResult && <video ref={videoRef} playsInline muted className={styles.video} />}
              {!scanResult && <canvas ref={overlayCanvasRef} className={styles.overlayCanvas} />}
              
              {!scanResult && (
                  <button 
                    type="button" 
                    className={styles.torchButton} 
                    onClick={toggleTorch}
                    style={{ backgroundColor: torchEnabled ? '#ffeb3b' : 'rgba(255,255,255,0.3)', color: torchEnabled ? '#000' : '#fff' }}
                  >
                    {torchEnabled ? '🔦 Выкл' : '🔦 Вкл'}
                  </button>
              )}

              {scanResult && <img src={scanResult.image} alt="Scanned code" className={styles.resultImage} />}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            {scanResult ? (
              <div className={styles.resultActions}>
                <div className={styles.infoBlock}>
                  <p className={styles.detailsText}>Найдено: <b>{scanResult.texts.length}</b></p>
                </div>
                <div className={styles.buttonsRow}>
                  <button type="button" onClick={startCamera} className={`${styles.actionButton} ${styles.secondaryButton}`}>Переснять</button>
                  <button type="button" onClick={() => { onScan(scanResult.texts); handleClose(); }} className={styles.actionButton}>
                    Добавить (+{scanResult.newCount})
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.actions}>
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.actionButton}>Выбрать из галереи</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CameraScanner;
