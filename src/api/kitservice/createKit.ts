const BASE_URL = import.meta.env.VITE_BASE_URL;

interface CreateKitParams {
  pinCode: string;
  tsdUUID: string;
  docNum: string;
  scanCodes: string[];
}

export interface CreateKitResponse {
  error: string;
  info: string;
  infoType: string;
  // Removed 'status' as it's likely not part of the backend response based on standard pattern
  // Backend usually returns 'error' string if something is wrong, or empty string if success.
}

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
      // Cast to any to satisfy the explicit return type which might expect a specific interface
      // In a real app, you'd want to handle types more gracefully or allow error only responses
      return { error: text } as any;
    }
};
