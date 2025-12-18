import { GetDocResponse } from "./getDoc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface CreateKitParams {
  pinCode: string;
  tsdUUID: string;
  docNum: string;
  scanCodes: string[];
}

export type CreateKitResponse = GetDocResponse;

export const createKit = async (params: CreateKitParams): Promise<CreateKitResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}/kitservice/createKit`, {
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
