export const fetchPinAuth = async (pincode: number, tsdUUID?: string) => {
  try {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/pinauth",
      {
        method: "POST",
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
  }
};
