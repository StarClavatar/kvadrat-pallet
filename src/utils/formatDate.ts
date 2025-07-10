export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  const datePart = dateString.split(" ")[0];
  const parts = datePart.split(".");

  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("ru-RU");
  }

  return datePart;
}; 