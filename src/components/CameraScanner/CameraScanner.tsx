import { useState, useRef, useEffect } from "react";
import { readBarcodes, ReaderOptions, type ReadResult } from "zxing-wasm/reader";
import successSound from "../../assets/scanSuccess.mp3";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import styles from "./CameraScanner.module.css";

interface CameraScannerProps {
    onScan: (result: string) => void;
    formats?: ReaderOptions['formats'];
}

const CameraScanner = ({ onScan, formats = ["EAN-13", "DataMatrix"] }: CameraScannerProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scanResult, setScanResult] = useState<{ text: string; image: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const successAudio = new Audio(successSound);

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
                    requestAnimationFrame(scanFrame);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError(
                "Не удалось получить доступ к камере. Проверьте разрешения в браузере."
            );
        }
    };

    const stopCamera = () => {
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

    const drawBarcodeOnCanvas = (
        barcodes: ReadResult[],
        source: HTMLImageElement | HTMLVideoElement,
        container: HTMLElement
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const sourceWidth =
            (source as HTMLVideoElement).videoWidth ||
            (source as HTMLImageElement).naturalWidth;
        const sourceHeight =
            (source as HTMLVideoElement).videoHeight ||
            (source as HTMLImageElement).naturalHeight;

        const { width: containerWidth, height: containerHeight } =
            container.getBoundingClientRect();

        const scale = Math.min(
            containerWidth / sourceWidth,
            containerHeight / sourceHeight
        );
        const scaledWidth = sourceWidth * scale;
        const scaledHeight = sourceHeight * scale;

        const offsetX = (containerWidth - scaledWidth) / 2;
        const offsetY = (containerHeight - scaledHeight) / 2;

        canvas.width = containerWidth;
        canvas.height = containerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

        barcodes.forEach((barcode) => {
            const { topLeft, topRight, bottomRight, bottomLeft } = barcode.position;

            const transformPoint = (p: { x: number; y: number }) => ({
                x: p.x * scale + offsetX,
                y: p.y * scale + offsetY,
            });

            const pt = [
                transformPoint(topLeft),
                transformPoint(topRight),
                transformPoint(bottomRight),
                transformPoint(bottomLeft),
            ];

            ctx.beginPath();
            ctx.moveTo(pt[0].x, pt[0].y);
            ctx.lineTo(pt[1].x, pt[1].y);
            ctx.lineTo(pt[2].x, pt[2].y);
            ctx.lineTo(pt[3].x, pt[3].y);
            ctx.closePath();
            ctx.strokeStyle = "#4caf50";
            ctx.lineWidth = 3;
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
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            try {
                const results = await readBarcodes(imageData, { formats: formats ? formats : ["Any"], tryDownscale: true, tryHarder: true });
                if (results.length > 0) {
                    const imageWithBarcode = drawBarcodeOnCanvas(
                        results,
                        video,
                        container
                    );
                    stopCamera();
                    successAudio.play();
                    if (imageWithBarcode) {
                        setScanResult({
                            text: results[0].text.trim().replace(/^\((00|01)\)/, "$1"),
                            image: imageWithBarcode,
                        });
                    }
                    return; // Выходим из цикла
                }
            } catch (err) {
                // Ignore errors to continue scanning
            }
        }
        requestAnimationFrame(scanFrame);
    };

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        stopCamera();
        setError(null);
        setScanResult(null);

        try {
            const results = await readBarcodes(file);
            if (results.length > 0) {
                const image = new Image();
                image.onload = () => {
                    const container = canvasRef.current?.parentElement;
                    if (!container) return;

                    const imageWithBarcode = drawBarcodeOnCanvas(
                        results,
                        image,
                        container
                    );
                    successAudio.play();
                    if (imageWithBarcode) {
                        setScanResult({
                            text: results[0].text.trim().replace(/^\((00|01)\)/, "$1"),
                            image: imageWithBarcode,
                        });
                    }
                };
                image.src = URL.createObjectURL(file);
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
            onScan(scanResult.text);
            handleClose();
        }
    };

    const handleClose = () => {
        stopCamera();
        setIsModalOpen(false);
        setScanResult(null);
        setError(null);
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
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={styles.scanButton}
            >
                <BarCodeIcon />
            </button>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={handleClose}
                        >
                            &times;
                        </button>
                        <h3 className={styles.modalTitle}>Сканирование кода</h3>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.scannerContainer}>
                            {!scanResult && (
                                <video ref={videoRef} playsInline muted className={styles.video} />
                            )}
                            {scanResult && (
                                <img
                                    src={scanResult.image}
                                    alt="Scanned code"
                                    className={styles.resultImage}
                                />
                            )}
                            <canvas ref={canvasRef} style={{ display: "none" }} />
                        </div>

                        {scanResult ? (
                            <div className={styles.resultActions}>
                                <p className={styles.resultText}>
                                    <b>Распознано:</b> {scanResult.text}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className={styles.actionButton}
                                >
                                    Подтвердить
                                </button>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className={styles.actionButton}
                                >
                                    Сканировать снова
                                </button>
                            </div>
                        ) : (
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={styles.actionButton}
                                >
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
