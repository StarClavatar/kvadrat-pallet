import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import successSound from "../../assets/scanSuccess.mp3";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import styles from "./CameraScanner.module.css";
import { useBarcodeDetector, DetectedBarcode } from "../../hooks/useBarcodeDetector";
import { readBarcodes } from "zxing-wasm/reader";

const FORMAT_MAP: Record<string, string> = {
  "DataMatrix": "data_matrix",
  "QRCode": "qr_code",
  "Code128": "code_128",
  "EAN-13": "ean_13",
  "EAN-8": "ean_8",
  "ITF": "itf",
  "PDF417": "pdf417",
  "Aztec": "aztec",
  "Codabar": "codabar",
  "Code39": "code_39",
  "Code93": "code_93",
  "UPC-A": "upc_a",
  "UPC-E": "upc_e"
};

const SOUND_COOLDOWN_MS = 1200;
const SAME_CODES_COOLDOWN_MS = 1800;

type BarcodeFormat = 
  | "DataMatrix" 
  | "QRCode" 
  | "Code128" 
  | "EAN-13" 
  | "EAN-8" 
  | "ITF" 
  | "PDF417" 
  | "Aztec" 
  | "Codabar" 
  | "Code39" 
  | "Code93" 
  | "UPC-A" 
  | "UPC-E";

export type CameraScannerHandle = {
  /** Открыть модалку камеры (как нажатие «Сканировать»). */
  open: () => void;
};

interface CameraScannerProps {
  onScan: (results: string[]) => void;
  className?: string;
  textButton?: string | JSX.Element;
  expectedCount?: number;
  iconWidth?: number;
  iconHeight?: number;
  buttonFontSize?: number;
  existingCodes?: string[];
  formats?: BarcodeFormat[];
  closeOnScan?: boolean;
  scannerText?: string;
  validateCode?: (code: string) => boolean;
  defaultOpen?: boolean;
  buttonHeight?: number;
  buttonDisabled?: boolean;
  fullscreen?: boolean;
  targetTotal?: number;
  /** Показать сверху модалки счётчик «добавлено за сессию» (значение с родителя). */
  modalSessionCount?: number;
  /** Вызывается при открытии/закрытии модалки камеры. */
  onModalOpenChange?: (isOpen: boolean) => void;
  /** Принудительно использовать ZXing вместо Barcode Detection API. */
  forceZXing?: boolean;
  /** Не воспроизводить встроенный звук при детекте (родитель сам, например по факту добавления). */
  muteDetectorSuccessSound?: boolean;
}

const CameraScanner = forwardRef<CameraScannerHandle, CameraScannerProps>(
  function CameraScanner(
    {
      onScan,
      className,
      textButton,
      expectedCount,
      buttonDisabled = false,
      iconWidth = 24,
      iconHeight = 24,
      existingCodes = [],
      formats = ["DataMatrix", "QRCode", "Code128", "EAN-13"],
      closeOnScan = false,
      scannerText,
      validateCode,
      buttonFontSize = 16,
      buttonHeight = 30,
      defaultOpen = false,
      fullscreen = false,
      modalSessionCount,
      onModalOpenChange,
      forceZXing = false,
      muteDetectorSuccessSound = false,
    },
    ref
  ) {
  const [isModalOpen, setIsModalOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  // Convert ZXing formats to Native formats
  // Memoize to prevent infinite re-render loops if parent passes new array reference
  const nativeFormats = useMemo(() => formats
    .map(f => FORMAT_MAP[f] || f.toLowerCase())
    .filter(Boolean), [formats.join(',')]);

  const { detector } = useBarcodeDetector(nativeFormats);
  const useNativeDetector = !forceZXing && !!detector;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastScanTimeRef = useRef<number>(0);
  const lastSoundAtRef = useRef<number>(0);
  const lastEmittedCodesKeyRef = useRef<string>("");
  const lastEmittedAtRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const successAudio = useMemo(() => new Audio(successSound), []);

  /** Как `normalizeCode` в MassMarkingScan: все управляющие символы по строке, не только в начале — иначе на Android (BarcodeDetector) GS внутри кода не совпадает с `existingCodes`. */
  const cleanCode = (text: string) => {
    let s = text.replace(/[\x00-\x1F\x7F]+/g, "").trim();
    s = s.replace(/\((00|01|21|93)\)/g, "$1");
    return s;
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities();
      // @ts-ignore
      if (capabilities.torch) {
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ torch: !torchEnabled }] });
        setTorchEnabled(!torchEnabled);
      }
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  const drawOverlay = (barcodes: DetectedBarcode[], video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    const container = video.parentElement;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: cw, height: ch } = container.getBoundingClientRect();
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Set canvas to match container exactly
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.clearRect(0, 0, cw, ch);

    // Calculate scaling to match object-fit: cover (fullscreen) or contain
    const scale = fullscreen 
      ? Math.max(cw / vw, ch / vh)
      : Math.min(cw / vw, ch / vh);
      
    const scaledW = vw * scale;
    const scaledH = vh * scale;
    const offsetX = (cw - scaledW) / 2;
    const offsetY = (ch - scaledH) / 2;

    barcodes.forEach((barcode) => {
      const rawText = barcode.rawValue;
      const text = cleanCode(rawText);
      
      const isValid = validateCode ? validateCode(text) : true;
      const isDuplicate = existingCodes.includes(text);

      ctx.beginPath();
      
      // Transform coordinates
      const transform = (x: number, y: number) => ({
        x: x * scale + offsetX,
        y: y * scale + offsetY
      });

      if (barcode.cornerPoints && barcode.cornerPoints.length === 4) {
        const points = barcode.cornerPoints.map(p => transform(p.x, p.y));
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
      } else {
        const { x, y, width, height } = barcode.boundingBox;
        const p1 = transform(x, y);
        const p2 = transform(x + width, y + height);
        ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      }
      ctx.closePath();

      if (!isValid) {
        ctx.strokeStyle = "#f44336"; 
        ctx.fillStyle = "rgba(244, 67, 54, 0.2)";
      } else if (isDuplicate) {
        ctx.strokeStyle = "#FFD700";
        ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
      } else {
        ctx.strokeStyle = "#4caf50";
        ctx.fillStyle = "rgba(76, 175, 80, 0.2)";
      }

      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fill();
    });
  };

  const scanLoop = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      requestRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    // Throttle scanning slightly to save battery, but keep it smooth (e.g., 30fps)
    const now = performance.now();
    if (now - lastScanTimeRef.current < 30) {
      requestRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    lastScanTimeRef.current = now;

    try {
      let barcodes: DetectedBarcode[] = [];

      if (useNativeDetector && detector) {
        // Native detection
        barcodes = await detector.detect(videoRef.current);
        
      } else {
        // Fallback to ZXing
        // For ZXing we need a temporary canvas to draw the frame
        // Or we can use the video element directly if ZXing supports it (readBarcodes usually takes ImageData or ImageBitmap)
        // Creating a small offscreen canvas for better performance? Or use the full res one?
        // Let's use an offscreen canvas for processing to not affect UI
        const offscreenCanvas = document.createElement('canvas');
        // Reduce resolution for performance on older devices?
        const scale = 0.5; 
        offscreenCanvas.width = videoRef.current.videoWidth * scale;
        offscreenCanvas.height = videoRef.current.videoHeight * scale;
        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            
            const results = await readBarcodes(imageData, {
                formats: formats as any, // ZXing expects its own format strings which match ours mostly
                tryHarder: true,
                ...(typeof expectedCount === "number" ? { maxNumberOfSymbols: expectedCount } : {})
            });

            // Convert ZXing results to DetectedBarcode format
            barcodes = results.map(res => ({
                rawValue: res.text,
                format: res.format,
                boundingBox: new DOMRectReadOnly(
                    res.position.topLeft.x / scale, 
                    res.position.topLeft.y / scale, 
                    (res.position.topRight.x - res.position.topLeft.x) / scale, 
                    (res.position.bottomLeft.y - res.position.topLeft.y) / scale
                ),
                cornerPoints: [
                    { x: res.position.topLeft.x / scale, y: res.position.topLeft.y / scale },
                    { x: res.position.topRight.x / scale, y: res.position.topRight.y / scale },
                    { x: res.position.bottomRight.x / scale, y: res.position.bottomRight.y / scale },
                    { x: res.position.bottomLeft.x / scale, y: res.position.bottomLeft.y / scale }
                ]
            }));
        }
      }
      
      // Draw results immediately
      drawOverlay(barcodes, videoRef.current);

      if (barcodes.length > 0) {
        // Filter valid codes
        const validBarcodes = barcodes.filter(b => {
          const text = cleanCode(b.rawValue);
          return validateCode ? validateCode(text) : true;
        });

        // Check if we have enough valid codes visible simultaneously
        const minRequiredCount = typeof expectedCount === "number" ? expectedCount : 1;
        if (validBarcodes.length >= minRequiredCount) {
          const allTexts = validBarcodes.map(b => cleanCode(b.rawValue));
          const texts = typeof expectedCount === "number" ? allTexts.slice(0, expectedCount) : allTexts;

          // Anti-spam: пока тот же набор кодов в кадре, не шумим и не шлём onScan циклически.
          const codesKey = Array.from(new Set(texts)).sort().join("||");
          const nowMs = Date.now();
          const isSameRecent =
            codesKey.length > 0 &&
            codesKey === lastEmittedCodesKeyRef.current &&
            nowMs - lastEmittedAtRef.current < SAME_CODES_COOLDOWN_MS;

          if (isSameRecent) {
            requestRef.current = requestAnimationFrame(scanLoop);
            return;
          }

          if (nowMs - lastSoundAtRef.current >= SOUND_COOLDOWN_MS) {
            if (!muteDetectorSuccessSound) {
              successAudio.play().catch(() => {});
            }
            lastSoundAtRef.current = nowMs;
          }

          lastEmittedCodesKeyRef.current = codesKey;
          lastEmittedAtRef.current = nowMs;
          
          if (closeOnScan) {
            onScan(texts);
            handleClose();
          } else {
            // If we don't close, we might want to debounce this or just fire it
            // For now, let's fire and let parent handle deduplication if needed
            onScan(texts);
            // Optional: Pause briefly to prevent spamming?
          }
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    requestRef.current = requestAnimationFrame(scanLoop);
  }, [detector, useNativeDetector, validateCode, expectedCount, closeOnScan, successAudio, onScan, formats, muteDetectorSuccessSound]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // @ts-ignore
          focusMode: { ideal: "continuous" }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Use promise-based play() for robustness
        videoRef.current.play().then(() => {
            requestRef.current = requestAnimationFrame(scanLoop);
        }).catch(e => {
            console.error("Video play failed:", e);
        });
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Нет доступа к камере. Проверьте разрешения.");
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    lastEmittedCodesKeyRef.current = "";
    lastEmittedAtRef.current = 0;
    lastSoundAtRef.current = 0;
    setTorchEnabled(false);
  };

  const handleClose = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isModalOpen]); // Removed detector from deps to avoid re-starting camera when it loads

  const onModalOpenChangeRef = useRef(onModalOpenChange);
  onModalOpenChangeRef.current = onModalOpenChange;

  useEffect(() => {
    onModalOpenChangeRef.current?.(isModalOpen);
  }, [isModalOpen]);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setIsModalOpen(true),
    }),
    []
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`${styles.scanButton} ${className || ""}`}
        disabled={buttonDisabled}
      >
        {textButton ? (
          <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: buttonFontSize + "px", height: buttonHeight + "px" }}>
            {textButton} <BarCodeIcon width={iconWidth} height={iconHeight} />
          </span>
        ) : (
          <BarCodeIcon width={iconWidth} height={iconHeight} />
        )}
      </button>

      {isModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            typeof modalSessionCount === "number" ? styles.modalOverlayWithSession : ""
          }`}
        >
          {typeof modalSessionCount === "number" && (
            <div className={styles.sessionCounterBar} aria-live="polite">
              Добавлено: {modalSessionCount}
            </div>
          )}
          {scannerText && <h4 className={styles.modalTitle}>{scannerText}</h4>}
          
          <div className={`${styles.modalContent} ${fullscreen ? styles.modalContentFullscreen : ""}`}>
            <button type="button" className={styles.closeButton} onClick={handleClose}>
              &times;
            </button>

            <button
              type="button"
              className={styles.torchButton}
              onClick={toggleTorch}
              style={{
                backgroundColor: torchEnabled ? "rgba(255, 235, 59, 0.8)" : "rgba(0, 0, 0, 0.5)",
                color: torchEnabled ? "#000" : "#fff"
              }}
            >
              🔦
            </button>

            {error && <div className={styles.errorText}>{error}</div>}
            
            {/* Show info only if truly unsupported (fallback failed or very old browser) - here we assume fallback works so we hide this unless debugging */}
            {/* {isSupported === false && !detector && (
              <div className={styles.errorText} style={{color: 'orange'}}>
                Using fallback scanner (WASM). Performance might be slower.
              </div>
            )} */}

            <div className={styles.scannerContainer}>
              <video
                ref={videoRef}
                className={`${styles.video} ${fullscreen ? styles.videoFullscreen : ""}`}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className={styles.overlayCanvas}
              />
              {/* Mode Indicator */}
              <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  zIndex: 20,
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  pointerEvents: 'none'
              }}>
                  {useNativeDetector ? "Barcode Detection API" : "ZXing"}
              </div>
            </div>
            
            {/* Fallback for file upload if needed could go here, but focusing on camera as requested */}
          </div>
        </div>
      )}
    </>
  );
});

export default CameraScanner;
