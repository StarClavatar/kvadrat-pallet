import { useState, useRef, useEffect } from "react";
import { readBarcodes, ReaderOptions, type ReadResult } from "zxing-wasm/reader";
import successSound from "../../assets/scanSuccess.mp3";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import styles from "./CameraScanner.module.css";

interface CameraScannerProps {
  onScan: (results: string[]) => void;
  className?: string;
  textButton?: string;
  expectedCount?: number; // лимит распознавания кодов
  iconWidth?: number;
  iconHeight?: number;
  existingCodes?: string[];
  targetTotal?: number;
  formats?: ReaderOptions["formats"];
  closeOnScan?: boolean; // если есть параметр, то пропускаем окошко подтверждения и сразу вызываем onScan
  scannerText?: string;
  validateCode?: (code: string) => boolean; // Функция валидации кода (например, проверка GTIN)
  defaultOpen?: boolean;
  buttonHeight?: number;
}

const CameraScanner = ({
  onScan,
  className,
  textButton,
  expectedCount = 1,
  iconWidth = 24,
  iconHeight = 24,
  existingCodes = [],
  targetTotal,
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

  const successAudio = new Audio(successSound);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For image capture
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // For real-time overlay
  const requestRef = useRef<number>();
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  const startCamera = async () => {
    setError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
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
      alert(err)
      console.error("Camera access error:", err);
      setError("Не удалось получить доступ к камере. Проверьте разрешения в браузере.");
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
      video.onloadedmetadata = null;
    }
  };

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
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Draws on the overlay canvas (transparent)
  const drawOverlay = (
    barcodes: ReadResult[],
    video: HTMLVideoElement,
    container: HTMLElement
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    // Simulate object-fit: contain
    const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
    const scaledWidth = sourceWidth * scale;
    // const scaledHeight = sourceHeight * scale; // Unused but consistent with logic

    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - (sourceHeight * scale)) / 2;

    const currentBatchCodes: string[] = [];

    barcodes.forEach((barcode) => {
      const text = cleanCode(barcode.text);

      const isValid = validateCode ? validateCode(text) : true;
      const isGlobalDuplicate = existingCodes.includes(text);
      const isBatchDuplicate = currentBatchCodes.includes(text);

      if (!isBatchDuplicate) {
        currentBatchCodes.push(text);
      }

      const { topLeft, topRight, bottomRight, bottomLeft } = barcode.position;

      const transformPoint = (p: { x: number; y: number }) => ({
        x: p.x * scale + offsetX,
        y: p.y * scale + offsetY,
      });

      const pt = [transformPoint(topLeft), transformPoint(topRight), transformPoint(bottomRight), transformPoint(bottomLeft)];

      ctx.beginPath();
      ctx.moveTo(pt[0].x, pt[0].y);
      ctx.lineTo(pt[1].x, pt[1].y);
      ctx.lineTo(pt[2].x, pt[2].y);
      ctx.lineTo(pt[3].x, pt[3].y);
      ctx.closePath();

      if (!isValid) {
        ctx.strokeStyle = "#f44336"; // Red
      } else if (isGlobalDuplicate || isBatchDuplicate) {
        ctx.strokeStyle = "#FFD700"; // Gold
      } else {
        ctx.strokeStyle = "#4caf50"; // Green
      }

      ctx.lineWidth = 4;
      ctx.stroke();
    });
  };

  // Draws on the hidden processing canvas to generate the result image
  const drawBarcodeOnCanvas = (
    barcodes: ReadResult[],
    source: ImageBitmap | HTMLImageElement | HTMLVideoElement,
    container: HTMLElement
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    let sourceWidth: number;
    let sourceHeight: number;

    if (source instanceof HTMLVideoElement) {
      sourceWidth = source.videoWidth;
      sourceHeight = source.videoHeight;
    } else if (source instanceof ImageBitmap) {
      sourceWidth = source.width;
      sourceHeight = source.height;
    } else {
      sourceWidth = source.naturalWidth;
      sourceHeight = source.naturalHeight;
    }

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
    const scaledWidth = sourceWidth * scale;
    const scaledHeight = sourceHeight * scale;

    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

    const currentBatchCodes: string[] = [];

    barcodes.forEach((barcode) => {
      const text = cleanCode(barcode.text);

      const isValid = validateCode ? validateCode(text) : true;
      const isGlobalDuplicate = existingCodes.includes(text);
      const isBatchDuplicate = currentBatchCodes.includes(text);

      if (!isBatchDuplicate) {
        currentBatchCodes.push(text);
      }

      const { topLeft, topRight, bottomRight, bottomLeft } = barcode.position;

      const transformPoint = (p: { x: number; y: number }) => ({
        x: p.x * scale + offsetX,
        y: p.y * scale + offsetY,
      });

      const pt = [transformPoint(topLeft), transformPoint(topRight), transformPoint(bottomRight), transformPoint(bottomLeft)];

      ctx.beginPath();
      ctx.moveTo(pt[0].x, pt[0].y);
      ctx.lineTo(pt[1].x, pt[1].y);
      ctx.lineTo(pt[2].x, pt[2].y);
      ctx.lineTo(pt[3].x, pt[3].y);
      ctx.closePath();

      if (!isValid) {
        ctx.strokeStyle = "#f44336";
      } else if (isGlobalDuplicate || isBatchDuplicate) {
        ctx.strokeStyle = "#FFD700";
      } else {
        ctx.strokeStyle = "#4caf50";
      }

      ctx.lineWidth = 5;
      ctx.stroke();
    });

    return canvas.toDataURL("image/jpeg");
  };

  const scanFrame = async () => {
    const container = videoRef.current?.parentElement;
    if (
      !videoRef.current ||
      !canvasRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended ||
      !container
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const results = await readBarcodes(imageData, {
          maxNumberOfSymbols: expectedCount,
          formats: formats,
          tryHarder: true
        });

        // Always update overlay if results found or clear if not
        if (results.length > 0) {
          drawOverlay(results, video, container);
        } else {
          // Clear overlay if nothing found
          const oCanvas = overlayCanvasRef.current;
          const oCtx = oCanvas?.getContext('2d');
          if (oCanvas && oCtx) {
            oCtx.clearRect(0, 0, oCanvas.width, oCanvas.height);
          }
        }

        if (results.length > 0) {
          let validResults = results;
          if (validateCode) {
            const invalidCodes = results.filter(r => !validateCode!(cleanCode(r.text)));
            if (invalidCodes.length > 0) {
              // Show feedback for invalid codes
              if (!toastMessage) {
                showToast("GTIN товара не найден в заказе");
              }
              // We continue scanning, but we filter out invalid ones for the count check below
            }
            validResults = results.filter(r => validateCode!(cleanCode(r.text)));
          }

          const validTexts = validResults.map(r => cleanCode(r.text));
          const uniqueValidTexts = [...new Set(validTexts)];

          // Check if we have enough VALID codes
          if (uniqueValidTexts.length >= expectedCount) {
            // Capture snapshot with ALL results (valid + invalid so user sees what happened)
            const imageWithBarcode = drawBarcodeOnCanvas(results, video, container);
            stopCamera();
            successAudio.play();

            const validDedupedTexts = [...new Set(validTexts)];

            if (closeOnScan) {
              onScan(validDedupedTexts);
              handleClose();
              return;
            }

            if (imageWithBarcode) {
              const newCount = validDedupedTexts.filter(t => !existingCodes.includes(t)).length;
              const dupCount = validDedupedTexts.length - newCount;

              setScanResult({
                texts: validDedupedTexts,
                image: imageWithBarcode,
                newCount,
                dupCount
              });
            }
            return;
          } else {
            // Not enough valid codes yet, continue scanning
            requestRef.current = requestAnimationFrame(scanFrame);
            return;
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    stopCamera();
    setError(null);
    setScanResult(null);

    try {
      // Use createImageBitmap if available for correct orientation handling
      let imageSource: ImageBitmap | HTMLImageElement;

      try {
        if (typeof createImageBitmap !== 'undefined') {
          imageSource = await createImageBitmap(file);
        } else {
          imageSource = await loadImage(file);
        }
      } catch (e) {
        console.error("Error loading image:", e);
        // Fallback
        imageSource = await loadImage(file);
      }

      // Create temporary canvas to get ImageData for detection
      // This ensures we scan exactly what we will draw (correct orientation)
      const tempCanvas = document.createElement('canvas');
      const w = (imageSource instanceof ImageBitmap) ? imageSource.width : imageSource.naturalWidth;
      const h = (imageSource instanceof ImageBitmap) ? imageSource.height : imageSource.naturalHeight;

      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) throw new Error("Canvas context error");

      tempCtx.drawImage(imageSource, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, w, h);

      const results = await readBarcodes(imageData, {
        maxNumberOfSymbols: expectedCount,
        formats: ["DataMatrix", "QRCode"],
        tryHarder: true
      });

      if (results.length > 0) {

        const texts = results.map(r => cleanCode(r.text));

        // Validation Logic for File
        if (validateCode) {
          const invalidCodes = texts.filter(t => !validateCode(t));
          if (invalidCodes.length > 0) {
            alert("Найдены товары, не соответствующие набору (GTIN не совпадает).");
            startCamera(); // Restart camera
            return;
          }
        }

        const dedupedTexts = [...new Set(texts)];

        if (closeOnScan) {
          onScan(dedupedTexts);
          handleClose();
          return;
        }

        const container = canvasRef.current?.parentElement;
        if (!container) return;

        const imageWithBarcode = drawBarcodeOnCanvas(results, imageSource, container);
        successAudio.play();
        if (imageWithBarcode) {
          const newCount = dedupedTexts.filter(t => !existingCodes.includes(t)).length;
          const dupCount = dedupedTexts.length - newCount;

          setScanResult({
            texts: dedupedTexts,
            image: imageWithBarcode,
            newCount,
            dupCount
          });
        }
      } else {
        alert("Коды не найдены на изображении.");
        startCamera();
      }
    } catch (err) {
      console.error("File scan error:", err);
      alert("Не удалось отсканировать файл.");
      startCamera();
    }
  };

  const handleConfirm = () => {
    if (scanResult) {
      onScan(scanResult.texts);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsModalOpen(false);
    setScanResult(null);
    setError(null);
    setToastMessage(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  };

  useEffect(() => {
    if (isModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isModalOpen]);


  return (
    <>
      <button type="button" onClick={() => setIsModalOpen(true)} className={`${styles.scanButton} ${className || ""}`}>
        {textButton ? <span style={{ display: "flex", alignItems: "center", gap: "10px", height: buttonHeight + 'px' }}>{textButton} <BarCodeIcon width={iconWidth} height={iconHeight} /></span> : <BarCodeIcon width={iconWidth} height={iconHeight} />}
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          {scannerText && (
            <h4 className={styles.modalTitle}>
              {scannerText}
            </h4>
          )}
          <div className={styles.modalContent}>
            <button type="button" className={styles.closeButton} onClick={handleClose}>
              &times;
            </button>
            {/* <h3 className={styles.modalTitle}>Сканирование</h3> */}

            {error && <p className={styles.errorText}>{error}</p>}

            {/* Toast Message */}
            {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

            <div className={styles.scannerContainer}>
              {!scanResult && <video ref={videoRef} playsInline muted className={styles.video} />}
              {/* Overlay Canvas for real-time AR feedback */}
              {!scanResult && <canvas ref={overlayCanvasRef} className={styles.overlayCanvas} />}

              {scanResult && <img src={scanResult.image} alt="Scanned code" className={styles.resultImage} />}

              {/* Hidden canvas for processing and final image generation */}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            {scanResult ? (
              <div className={styles.resultActions}>

                <div className={styles.infoBlock}>
                  {/* <h3 className={styles.modalTitle}>Результат сканирования</h3> */}
                  <p className={styles.detailsText}>
                    Найдено кодов: <b>{scanResult.texts.length}</b>
                    <br />
                    <span style={{ color: "#2e7d32", fontWeight: "bold" }}>Новых: {scanResult.newCount}</span>
                    {" • "}
                    {/* <span style={{color: "#f57f17", fontWeight: "bold"}}>Повторов: {scanResult.dupCount}</span> */}
                  </p>
                  {targetTotal && (
                    <p className={styles.detailsText} style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                      Прогресс набора: {existingCodes.length} → {Math.min(existingCodes.length + scanResult.newCount, targetTotal)} / {targetTotal}
                    </p>
                  )}
                </div>

                <div className={styles.buttonsRow}>
                  <button type="button" onClick={startCamera} className={`${styles.actionButton} ${styles.secondaryButton}`}>Переснять</button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={styles.actionButton}
                    disabled={scanResult.newCount === 0}
                    style={scanResult.newCount === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    {scanResult.newCount > 0 ? `Добавить (+${scanResult.newCount})` : 'Нет новых'}
                  </button>
                </div>

              </div>
            ) : (
              <div className={styles.actions}>
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.actionButton}>
                  Выбрать из галереи
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CameraScanner;
