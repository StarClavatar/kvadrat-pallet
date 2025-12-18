import { GetDocResponse } from "./getDoc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface GetKitParams {
  pinCode: string;
  tsdUUID: string;
  scanCod: string;
  docNum: string;
}

export type GetKitResponse = GetDocResponse;

export const getKit = async (params: GetKitParams): Promise<GetKitResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}/kitservice/getKit`, {
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
