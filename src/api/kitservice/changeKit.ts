import { GetDocResponse } from "./getDoc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface ChangeKitParams {
  pinCode: string;
  tsdUUID: string;
  kitNum: string;
  scanCodes: string[];
  docNum: string
}

export type ChangeKitResponse = GetDocResponse;

export const changeKit = async (params: ChangeKitParams): Promise<ChangeKitResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}/kitservice/changeKit`, {
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
