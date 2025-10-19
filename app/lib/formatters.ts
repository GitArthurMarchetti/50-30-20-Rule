import { Decimal } from "@prisma/client/runtime/library";

type CurrencyOptions = {
  locale?: string;
  currency?: string;
};

export function formatCurrency(
  amount: number | Decimal,
  options: CurrencyOptions = {}
): string {
  const { locale = "en", currency = "CAD" } = options;

  const numericAmount = typeof amount === 'number' ? amount : amount.toNumber();

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numericAmount);
}