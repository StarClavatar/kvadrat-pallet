const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface IDisbandmentRequest {
  pinCode: string;
  tsdUUID: string;
  codes: string[];
}

export interface IDisbandmentResponse {
  error?: string;
  [key: string]: any;
}

export const putDisbandment = async (
  pinCode: string,
  tsdUUID: string,
  codes: string[]
): Promise<IDisbandmentResponse> => {
  // Обрабатываем коды: если начинается с 2 нулей - обрезаем их
  const processedCodes = codes.map(code => {
    if (code.startsWith('00')) {
      return code.substring(2);
    }
    return code;
  });

  const response = await fetch(
    `${BASE_URL}/Disbandment/putDisbandment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinCode,
        tsdUUID,
        codes: processedCodes,
      }),
    }
  );

  return await response.json();
};
