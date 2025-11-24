interface AddSetParams {
    pin: string;
    tsd: string;
    codes: string[];
}
  
export const addSet = async (params: AddSetParams): Promise<any> => {
    // Это мок-функция. Она имитирует ответ сервера.
    // В реальном приложении здесь будет fetch-запрос.
    console.log("Отправка набора на сервер:", params);
  
    // Имитация успешного ответа
    if (params.codes.length === 3) {
      return Promise.resolve({ success: true, message: "Набор успешно создан." });
    }
  
    // Имитация ответа с ошибкой
    return Promise.resolve({ error: "Неверное количество кодов в наборе." });
};


