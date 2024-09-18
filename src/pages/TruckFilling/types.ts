interface ITruckGroup {
    productName: string;       // Наименование продукта
    productSerial: string;     // Серия продукта
    cartCount: number;         // Количество коробок
  }
  
  // Тип для описания паллеты
  interface ITruckPallet {
    palletSSCC: string;        // SSCC-код паллеты
    shipDate: string;          // Время начала формирования паллеты
    beginDate?: string;        // Дата начала формирования паллеты (опционально, если используется)
    endDate?: string;          // Дата завершения формирования паллеты (опционально, если используется)
    palletState?: string;      // Состояние паллеты (опционально, если используется)
    workerName: string;       // ФИО грузчика
    groups: ITruckPallet[];    // Массив описания товаров на паллете
  }
  
  // Основной тип данных
  interface ITruckInfo {
    error: string;             // Сообщение об ошибке, пустое если успешно
    info: string;              // Информация по последней добавленной коробке
    infoType: "next" | "yesNo" | ""; // Определяет кнопки, отображаемые под сообщением
    shipID: string;            // Код задания на отгрузку
    lastPalletSSCC: string;    // SSCC-код последней паллеты
    beginDate: string;         // Дата начала работы с фурой
    endDate: string;           // Дата завершения работы с фурой
    shipState: "план" | "погрузка" | "загружена" | "Погрузка завершена"; // Состояние фуры
    department: string;        // Подразделение
    shipZone: string;          // Участок отгрузки
    truckNumber: string;       // Гос. номер фуры
    responsible: string;       // Ответственный
    comment: string;           // Комментарий отгрузки
    pallets: ITruckPallet[]; // Массив погруженных паллет
  }