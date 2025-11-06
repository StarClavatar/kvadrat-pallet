const BASE_URL = import.meta.env.VITE_BASE_URL;

export const printCartLabel = async (
  pinCode: string,
  tsdUUID: string,
  SSCC: string,
  info?: string,
  infoType?: string
) => {
  const body: {
    pinCode: string;
    tsdUUID: string;
    SSCC: string;
    info?: string;
    infoType?: string;
  } = {
    pinCode,
    tsdUUID,
    SSCC,
  };

  if (info) body.info = info;
  if (infoType) body.infoType = infoType;

  const response = await fetch(`${BASE_URL}/cartservice/printCartLabel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response.json();
};
