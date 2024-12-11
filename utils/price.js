export const priceFormat = (num) => {
  if (num) {
    const strNum = num.toString();
    if (isNaN(+strNum)) return "не число";
    if (+strNum <= 0) return "цены равна 0 или ниже";

    if (strNum.includes(".")) {
      const [wholePart, fractionalPart] = strNum.split(".");
      const fixsFractionPart = String(fractionalPart).slice(0, 2);
      return Number(`${wholePart}.${fixsFractionPart}`);
    }

    return +num;
  } else {
    return "нет числа";
  }
};
