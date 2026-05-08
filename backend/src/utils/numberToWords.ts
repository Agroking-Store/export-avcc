const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const toEnglishUnderThousand = (value: number): string => {
  if (value === 0) {
    return "";
  }

  if (value < 20) {
    return ONES[value];
  }

  if (value < 100) {
    return `${TENS[Math.floor(value / 10)]}${
      value % 10 ? ` ${ONES[value % 10]}` : ""
    }`.trim();
  }

  return `${ONES[Math.floor(value / 100)]} Hundred${
    value % 100 ? ` ${toEnglishUnderThousand(value % 100)}` : ""
  }`.trim();
};

const toEnglishNumber = (value: number): string => {
  if (value === 0) {
    return "Zero";
  }

  const groups = [
    { size: 1_000_000_000, label: "Billion" },
    { size: 1_000_000, label: "Million" },
    { size: 1_000, label: "Thousand" },
    { size: 1, label: "" },
  ];

  let remainder = value;
  const parts: string[] = [];

  for (const group of groups) {
    const chunk = Math.floor(remainder / group.size);

    if (!chunk) {
      continue;
    }

    remainder %= group.size;
    parts.push(
      `${toEnglishUnderThousand(chunk)}${group.label ? ` ${group.label}` : ""}`.trim(),
    );
  }

  return parts.join(" ").trim();
};

const toIndianNumber = (value: number): string => {
  if (value === 0) {
    return "Zero";
  }

  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  let remainder = value % 10_000_000;

  if (crore) {
    parts.push(`${toEnglishNumber(crore)} Crore`);
  }

  const lakh = Math.floor(remainder / 100_000);
  remainder %= 100_000;

  if (lakh) {
    parts.push(`${toEnglishNumber(lakh)} Lakh`);
  }

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (thousand) {
    parts.push(`${toEnglishNumber(thousand)} Thousand`);
  }

  const hundredPart = toEnglishUnderThousand(remainder);

  if (hundredPart) {
    parts.push(hundredPart);
  }

  return parts.join(" ").trim();
};

const getDecimalPart = (value: number) =>
  Math.round((Math.abs(value) - Math.floor(Math.abs(value))) * 100);

export const numberToWordsUSD = (value: number): string => {
  const whole = Math.floor(Math.abs(value));
  const cents = getDecimalPart(value);
  const base = `Dollars ${toEnglishNumber(whole)}`;

  return cents
    ? `${base} and ${toEnglishNumber(cents)} Cents Only`
    : `${base} Only`;
};

export const numberToWordsINR = (value: number): string => {
  const whole = Math.floor(Math.abs(value));
  const paise = getDecimalPart(value);
  const base = `Rupees ${toIndianNumber(whole)}`;

  return paise
    ? `${base} and ${toEnglishNumber(paise)} Paise Only`
    : `${base} Only`;
};
