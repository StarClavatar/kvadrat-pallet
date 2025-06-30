export const fetchDocInfo = async (
  pinCode: string,
  docNum: string,
  tsdUUID: string
) => {
  try {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/orderservice/docinfo",
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