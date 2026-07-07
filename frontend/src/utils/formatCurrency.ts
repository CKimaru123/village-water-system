export const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

export {}; // 👈 add this if there are no imports/exports above
