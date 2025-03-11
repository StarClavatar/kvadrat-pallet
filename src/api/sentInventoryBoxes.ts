// Функция для экранирования специальных символов в строках
export function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r")
    .replace(/[\u0000-\u001F]/g, (match) => {
      // Экранирование управляющих символов (коды от 0 до 31)
      return "\\u" + ("0000" + match.charCodeAt(0).toString(16)).slice(-4);
    });
}

// Интерфейс для данных запроса
interface InventoryBoxesRequestData {
  pinCode: number | undefined;
  tsdUUID: string | null;
  cellCode: string;
  matrixCodes: string[];
}

/**
 * Функция для очистки строки от проблемных символов
 * Удаляет все управляющие символы и заменяет их на пробелы
 */
function sanitizeString(str: string): string {
  if (!str) return "";
  // Заменяем все управляющие символы (ASCII 0-31) на пробелы
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
}

/**
 * Функция для отправки данных на сервер
 * Использует FormData вместо JSON для более надежной передачи данных
 */
export async function sendInventoryBoxesToServer(
  pinCode: number | undefined,
  tsdUUID: string | null,
  cellCode: string,
  matrixCodes: string[]
): Promise<any> {
  if (!cellCode || matrixCodes.length === 0) {
    throw new Error("Не указан код ячейки или список кодов пуст");
  }

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_URL = `${VITE_BASE_URL}/markstowmscell`;

  // Очищаем все строки от проблемных символов
  const sanitizedCellCode = sanitizeString(cellCode);
  const sanitizedMatrixCodes = matrixCodes.map((code) => sanitizeString(code));

  // Создаем объект с очищенными данными
  const requestData: InventoryBoxesRequestData = {
    pinCode,
    tsdUUID,
    cellCode: sanitizedCellCode,
    matrixCodes: sanitizedMatrixCodes,
  };

  try {
    // Преобразуем объект в JSON-строку
    const jsonData = JSON.stringify(requestData);

    // Выводим в консоль для отладки
    console.log("Отправляемые данные:", jsonData);

    // Отправляем запрос на сервер
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: jsonData,
    });

    // Проверяем ответ
    if (!response.ok) {
      // Пытаемся получить текст ошибки
      const errorText = await response.text();
      console.error("Ошибка ответа сервера:", errorText);

      try {
        // Пытаемся распарсить JSON, если возможно
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || "Ошибка при отправке данных");
      } catch (parseError) {
        // Если не удалось распарсить JSON, возвращаем текст ошибки
        throw new Error(`Ошибка при отправке данных: ${errorText}`);
      }
    }

    // Получаем ответ в виде текста
    const responseText = await response.text();

    // Если ответ пустой, возвращаем пустой объект
    if (!responseText) {
      return {};
    }

    // Пытаемся распарсить JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("Ошибка при парсинге ответа:", parseError);
      return { text: responseText };
    }
  } catch (error) {
    console.error("Ошибка при отправке данных:", error);
    throw error;
  }
}
