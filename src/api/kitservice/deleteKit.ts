import { GetDocResponse } from "./getDoc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface DeleteKitParams {
  pinCode: string;
  tsdUUID: string;
  kitNum: string;
  docNum: string
}

export type DeleteKitResponse = GetDocResponse;

export const deleteKit = async (params: DeleteKitParams): Promise<DeleteKitResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}/kitservice/deleteKit`, {
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
