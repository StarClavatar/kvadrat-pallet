export const fetchPinAuth = async (pincode: number, tsdUUID?: string, signal?: AbortSignal) => {
  try {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/pinauth",
      {
        method: "POST",
        signal: signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pincode: pincode,
          tsdUUID: tsdUUID ? tsdUUID : '',
        }),
      }
    );
    return response.json();
  } catch (error) {
    console.log(error);
    throw error; // бросаем ошибку, чтобы её можно было обработать в месте вызова
  }
};