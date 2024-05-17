export type Cart = {
  time: string;
  cartSSCC: string;
  productName: string;
  productSerial: string;
  workerName: string;
  pinCode: number;
  tsdUUID: string;
};

export type TGroup = {
  productName: string;
  produtSerial: string;
  cartCount: number;
  cartsOnCount: number;
  groupState: "Новая" | "Формируется" | "Собрана" | "Завершена";
  carts: Cart[];
};

export type Pallet = {
  error: string;
  palleteSSCC: string;
  beginDate: string;
  endDate: string;
  palleteState: "Новая" | "Формируется" | "Собрана" | "Завершена";
  groups: TGroup[];
  user: string;
};

export const pallet: Pallet = {
  error: "",
  user: "Грузчиков Ермолай Семёныч",
  palleteSSCC: "00046600112100000001",
  beginDate: "20240502 15:30:55",
  endDate: "",
  palleteState: "Формируется",
  groups: [
    {
      productName: "Магний В6 форте таб. 1,133 г №30 Апрель",
      produtSerial: "0171123",
      cartCount: 40,
      cartsOnCount: 2,
      groupState: "Формируется",
      carts: [
        {
          time: "20240502 15:31:55",
          cartSSCC: "00046600112100000258",
          productName: "Магний В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0171123",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:32:06",
          cartSSCC: "00046600112100000260",
          productName: "Магний В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0171123",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
      ],
    },
    {
      productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
      produtSerial: "0155458",
      cartCount: 50,
      cartsOnCount: 1,
      groupState: "Формируется",
      carts: [
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
      ],
    },
    {
      productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
      produtSerial: "0155458",
      cartCount: 50,
      cartsOnCount: 1,
      groupState: "Формируется",
      carts: [
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
      ],
    },
    {
      productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
      produtSerial: "0155458",
      cartCount: 50,
      cartsOnCount: 5,
      groupState: "Формируется",
      carts: [
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },
        {
          time: "20240502 15:33:45",
          cartSSCC: "00046600112100000399",
          productName: "Кальций В6 форте таб. 1,133 г №30 Апрель",
          productSerial: "0155458",
          workerName: "Иванов И.И.",
          pinCode: 1212,
          tsdUUID: "112f44d2-0d32-11ef-8013-ced02a083124",
        },


      ],
    },
    

  ],
};
