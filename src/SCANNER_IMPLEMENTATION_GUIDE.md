# Руководство по реализации сканера штрих-кодов с zxing-wasm

Это руководство описывает логику работы React-приложения для сканирования штрих-кодов (DataMatrix, QR и др.) с использованием библиотеки `zxing-wasm`. Оно предназначено для воссоздания функционала в другом проекте.

## Ключевой функционал

1.  **Сканирование в реальном времени**: Использует камеру устройства для непрерывного поиска и распознавания штрих-кодов в видеопотоке.
2.  **Сканирование из файла**: Позволяет пользователю загрузить изображение из галереи устройства или сделать моментальный снимок для распознавания кодов.
3.  **Визуализация результатов**: После успешного сканирования обводит найденные штрих-коды рамками прямо на изображении или кадре с камеры.
4.  **Обработка данных**: Получает текстовое содержимое кода, его формат и координаты.

## Технологический стек

-   **React**: UI-библиотека.
-   **zxing-wasm**: Высокопроизводительная библиотека для распознавания штрих-кодов, скомпилированная в WebAssembly (WASM) для скорости.
-   **TypeScript**: Для типизации.

---

## Пошаговая реализация

### Шаг 1: Настройка UI и пользовательского ввода

Для работы сканера необходимы три основных элемента в UI и кнопки для взаимодействия с пользователем.

**HTML-структура (в JSX):**

```jsx
// Элемент для отображения видеопотока с камеры
<video ref={videoRef} playsInline muted />

// Скрытый canvas для обработки кадров и отрисовки
<canvas ref={scanningCanvasRef} style={{ display: 'none' }} />

// --- Кнопки и инпуты для пользователя ---

// Кнопка, которая открывает выбор файла из галереи
<button onClick={() => fileInputRef.current?.click()}>
  Выбрать из галереи
</button>

// Скрытый input, который мы активируем по клику на кнопку
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
/>

/* 
  Для того чтобы дать пользователю возможность сделать фото,
  можно использовать тот же input, но с атрибутом 'capture'.
  На мобильных устройствах это сразу откроет камеру.
  Можно сделать отдельную кнопку "Сделать фото", которая будет
  программно кликать на такой input:
*/
<input
  type="file"
  accept="image/*"
  capture="environment" // 'environment' - задняя камера, 'user' - фронтальная
  onChange={handleFileSelect}
/>
```

**Пояснение:**
-   `<video>`: Показывает пользователю то, что "видит" камера.
-   `<canvas>`: Работает "за кулисами". Мы копируем на него кадры из видео, чтобы передать их библиотеке `zxing-wasm`. На нем же мы рисуем рамки вокруг найденных кодов.
-   `<input type="file">`: Это стандартный способ дать пользователю выбрать файл. Мы можем кастомизировать его поведение:
    -   **Выбор из галереи**: Простой вызов `click()` на инпуте.
    -   **Сделать фото**: Добавление атрибута `capture="environment"` к инпуту превращает его в кнопку для создания снимка на мобильных устройствах.

### Шаг 2: Доступ к камере

Чтобы начать сканирование, нужно получить разрешение пользователя и включить камеру.

**Функция `startCamera`:**

-   Использует `navigator.mediaDevices.getUserMedia({ video: { ... } })` для запроса доступа.
-   Важный параметр `facingMode: 'environment'` включает заднюю камеру.
-   Полученный видеопоток (`stream`) передается в элемент `<video>`.
-   После успешного запуска видео (`videoRef.current.play()`) запускается цикл сканирования.

```typescript
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment', // Задняя камера
        width: 1920, 
        height: 1080,
      },
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        // Запускаем непрерывное сканирование
        startScanning(); 
      });
    }
  } catch (err) {
    console.error('Ошибка доступа к камере:', err);
    // Здесь нужно обработать отказ пользователя или отсутствие камеры
  }
};
```

### Шаг 3: Сканирование в реальном времени

Это непрерывный процесс, где мы анализируем каждый кадр видеопотока.

**Функция `scanFrame`:**

-   Использует `requestAnimationFrame` для создания плавного цикла, который не блокирует браузер.
-   **Захват кадра**: Копирует текущее изображение из `<video>` на скрытый `<canvas>` с помощью `ctx.drawImage()`.
-   **Анализ**: Получает данные изображения с `canvas` (`ctx.getImageData()`) и передает их в `readBarcodes()`.
-   **Результат**:
    -   Если `readBarcodes` находит код, цикл останавливается, и результаты передаются на обработку.
    -   Если ничего не найдено, `scanFrame` снова запрашивает `requestAnimationFrame`, продолжая цикл.

```typescript
// Импорт главной функции
import { readBarcodes } from 'zxing-wasm/reader';

const scanFrame = async () => {
  if (!videoRef.current || !scanningCanvasRef.current) return;

  const video = videoRef.current;
  const canvas = scanningCanvasRef.current;
  const ctx = canvas.getContext('2d');

  if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
    // Рисуем кадр на canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Отправляем на распознавание
      const results = await readBarcodes(imageData, { 
        formats: ['DataMatrix', 'QRCode'] 
      });
      
      if (results.length > 0) {
        // Коды найдены! Обрабатываем их.
        processResults(results);
        return; // Выходим из цикла
      }
    } catch (err) {
      // Ошибки можно игнорировать, чтобы сканирование продолжалось
    }
  }
  
  // Продолжаем цикл, если ничего не найдено
  requestAnimationFrame(scanFrame);
};
```

### Шаг 4: Сканирование из файла

Обработка изображения, выбранного пользователем.

**Функция `handleFileSelect`:**

-   Срабатывает при выборе файла через `<input type="file">`.
-   Получает объект `File` из `event.target.files[0]`.
-   **Важно**: Перед сканированием изображение нужно скорректировать с учетом EXIF-ориентации, иначе коды на фото, сделанных вертикально, могут не распознаться. Для этого пишется отдельная функция `getCorrectlyOrientedImage` (см. исходный код `App.tsx` для полного примера).
-   Передает `File` напрямую в `readBarcodes(file, { ... })`.
-   Результаты передаются в ту же функцию `processResults`.

```typescript
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Останавливаем камеру, если она была активна
  stopCamera();

  try {
    // Опционально, но рекомендуется: исправить ориентацию фото
    // const correctedImageFile = await getCorrectlyOrientedImage(file);
    
    const results = await readBarcodes(file, { 
      formats: ['DataMatrix', 'QRCode', 'EAN-13'] 
    });

    if (results.length > 0) {
      processResults(results, file); // Передаем и файл для отрисовки
    } else {
      alert('Коды не найдены на изображении');
    }
  } catch (err) {
    console.error('Ошибка сканирования файла:', err);
  }
};
```

### Шаг 5: Отрисовка рамок вокруг кодов

Самая наглядная часть — показать пользователю, где именно был найден код.

**Функция `drawBarcodesOnCanvas`:**

-   Принимает `<canvas>`, массив найденных кодов и исходное изображение (кадр видео или файл).
-   Сначала рисует на `canvas` само изображение (`ctx.drawImage(image, ...)`).
-   Затем для каждого найденного кода:
    -   `zxing-wasm` предоставляет `result.position` — объект с координатами 4-х углов кода (`topLeft`, `topRight` и т.д.).
    -   С помощью `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()` и `ctx.closePath()` рисуется четырехугольник по этим координатам.
    -   `ctx.strokeStyle` и `ctx.lineWidth` задают цвет и толщину рамки.
    -   `ctx.stroke()` применяет обводку.
-   В конце функция возвращает `canvas.toDataURL('image/jpeg')` — это `base64` строка с изображением, которую можно вставить в `src` тега `<img>` для показа пользователю.

```typescript
const drawBarcodesOnCanvas = (canvas, barcodes, image) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Рисуем исходное изображение
  canvas.width = image.naturalWidth || image.videoWidth;
  canvas.height = image.naturalHeight || image.videoHeight;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  // 2. Рисуем рамки для каждого кода
  barcodes.forEach(barcode => {
    const { topLeft, topRight, bottomRight, bottomLeft } = barcode.position;
    
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    
    ctx.strokeStyle = '#4caf50'; // Зеленый цвет
    ctx.lineWidth = 5;
    ctx.stroke();
  });

  // 3. Возвращаем результат как изображение
  return canvas.toDataURL('image/jpeg');
};
```

<!-- не читать этот код, тестовые данные
 const testQueryArray = {
    "pincode": 1212,
    "tsdUUID": "fa6f7092-8c9b-11f0-82a7-ced02a083124",
    "scannedCodes": [
        "(01)04670093991071(21)5WZ+TfPeCdCTj(93)zYbH",
        "(01)04670093991071(21)5c5mI!gqqq+4d(93)JiH5",
        "(01)04670093991071(21)5>5a%T;CopaLE(93)O62a",
        "(01)04670093991071(21)5CC?AMcCN9UJX(93)a0gr"
    ]
} -->
