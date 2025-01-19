const formatNumber = (number: number): string =>
  isNaN(number) ? "" : new Intl.NumberFormat("de-CH").format(number);

export default formatNumber;
