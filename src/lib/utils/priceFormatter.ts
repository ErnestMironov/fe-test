export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return '$0.000';
  }

  if (numPrice >= 0.01) {
    return `$${(numPrice ?? 0).toFixed(3)}`;
  } else {
    return `$${(numPrice ?? 0).toFixed(5)}`;
  }
}

export function formatPriceWithDecimals(
  price: string | number,
  decimals: number
): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return `$${(0.0).toFixed(decimals)}`;
  }

  return `$${(numPrice ?? 0).toFixed(decimals)}`;
}

/**
 * Formats price for display in tables with consistent width
 */
export function formatPriceForTable(price: string | number): string {
  const formatted = formatPrice(price);

  // Ensure consistent width for table alignment
  if (formatted.includes('.')) {
    const [dollars, cents] = formatted.split('.');
    const totalLength = dollars.length + 1 + cents.length; // +1 for decimal point

    if (totalLength <= 8) {
      return formatted;
    }
  }

  return formatted;
}
