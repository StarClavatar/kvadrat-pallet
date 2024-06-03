export const deleteCart = async ( pincode: string, palletSSCC: string, cartSSCC: string, tsdUUID: string ) => {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/palletservice/deleteCart",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pincode: pincode,
          tsdUUID: tsdUUID ? tsdUUID : '',
          palletSSCC: palletSSCC,
          cartSSCC: cartSSCC,
        }),
      }
    );
    return response.json();
};