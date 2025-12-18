const BASE_URL = import.meta.env.VITE_BASE_URL

interface KitDetail {
  prodName: string;
  GTIN: string;
  amount: number;
}

export interface GetDocResponse {
  error: string;
  info: string;
  infoType: string;
  docNum: string;
  docDate: string;
  docState: string;
  oderNum: string;
  oderDate: string;
  packer: string;
  prodName: string;
  GTIN: string;
  kitDetail: KitDetail[];
  packCount: number;
  collectedCount: number;
  KitNum?: string; // Номер набора (если редактируем или только что создали)
  scanCodes?: string[]; // Коды в наборе (если редактируем)
}

interface GetDocParams {
  pinCode: string;
  tsdUUID: string;
  scanCod: string;
}

export const getDoc = async (params: GetDocParams): Promise<GetDocResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };
  const response = await fetch(`${BASE_URL}/kitservice/getDoc`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(params),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: text } as any;
  }
};
