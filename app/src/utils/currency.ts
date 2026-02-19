export const USD_TO_INR = 91;

export const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'INR') => {
  const converted = currency === 'USD' ? amount : amount * USD_TO_INR;

  return new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : 'en-IN',
    {
      style: 'currency',
      currency: currency,
    }
  ).format(converted);
};
