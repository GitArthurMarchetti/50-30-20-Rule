import { Decimal } from "@prisma/client/runtime/library";

type CurrencyOptions = {
  locale?: string;
  currency?: string;
};

export function formatCurrency(
  amount: number | Decimal | null | undefined, 
  options: CurrencyOptions = {}
): string {
  const { locale = "en", currency = "CAD" } = options;

  let numericAmount = 0; 
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (amount && typeof amount.toNumber === 'function') {
    numericAmount = amount.toNumber();
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numericAmount);
}

