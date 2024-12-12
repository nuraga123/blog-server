export const priceFormat = (num) => {
  if (num) {
    const strNum = num.toString();
    if (isNaN(+strNum)) return "not_number";
    if (+strNum <= 0) return "prices_lower";
    if (strNum.includes(".")) {
      const [wholePart, fractionalPart] = strNum.split(".");
      const fixsFractionPart = String(fractionalPart).slice(0, 2);
      return Number(`${wholePart}.${fixsFractionPart}`);
    }
    return +num;
  } else {
    return "no_prices";
  }
};
