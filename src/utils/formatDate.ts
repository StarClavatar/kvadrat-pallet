export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  // Предполагаем, что дата может прийти как "дд.мм.гггг чч:мм:сс" или просто "дд.мм.гггг"
  const datePart = dateString.split(" ")[0];
  const parts = datePart.split(".");

  // Проверяем, что у нас есть 3 части (день, месяц, год)
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    // toLocaleDateString обеспечит формат дд.мм.гггг для русской локали
    return date.toLocaleDateString("ru-RU");
  }

  // Если формат неожиданный, возвращаем то, что было (без времени)
  return datePart;
}; 