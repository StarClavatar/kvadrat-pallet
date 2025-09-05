const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchDocInfo = async (
  pinCode: string,
  docNum: string,
  tsdUUID: string
) => {
  const response = await fetch(`${BASE_URL}/orderservice/docinfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      docNum,
      tsdUUID,
    }),
  });

  const responseText = await response.text();

  try {
    const data = JSON.parse(responseText);
    if (!response.ok && !data.error) {
      return { error: responseText };
    }
    return data;
  } catch (error) {
    return { error: responseText };
  }
}; 