const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchDocInfo = async (
  pinCode: string,
  docNum: string,
  tsdUUID: string
) => {
  try {
    const response = await fetch(
      `${BASE_URL}/orderservice/docinfo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinCode,
          docNum,
          tsdUUID,
        }),
      }
    );
    return await response.json();
  } catch (e) {
    return { error: "Ошибка сети" };
  }
}; 