export function formatPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'N/A';
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return 'N/A';
  }

  if (numPrice === 0) {
    return '$0.00';
  }

  if (numPrice < 0.000001) {
    return `$${numPrice.toExponential(2)}`;
  }

  if (numPrice < 0.01) {
    return `$${numPrice.toFixed(6)}`;
  }

  if (numPrice < 1) {
    return `$${numPrice.toFixed(4)}`;
  }

  if (numPrice < 100) {
    return `$${numPrice.toFixed(2)}`;
  }

  return `$${numPrice.toFixed(2)}`;
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

/**
 * Formats large numbers with letter suffixes (B, M, K) for better readability
 */
export function formatLargeNumberWithSuffix(
  value: string | number | null | undefined,
  prefix = ''
): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue) || numValue === 0) {
    return 'N/A';
  }

  if (numValue >= 1e9) {
    return `${prefix}${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `${prefix}${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `${prefix}${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return `${prefix}${numValue.toFixed(2)}`;
  }
}
