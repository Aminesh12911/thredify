import type { Size } from "@/types";

// Sample measurements in inches (draft values — verify against real samples before selling).
export const sizeGuide: Array<{ size: Size; chest: number; length: number; shoulder: number }> = [
  { size: "S", chest: 38, length: 26, shoulder: 16.5 },
  { size: "M", chest: 40, length: 27, shoulder: 17.5 },
  { size: "L", chest: 42, length: 28, shoulder: 18.5 },
  { size: "XL", chest: 44, length: 29, shoulder: 19.5 },
  { size: "XXL", chest: 46, length: 30, shoulder: 20.5 },
];

export const careInstructions = [
  "Machine wash cold with similar colours",
  "Turn inside out to protect the print",
  "Do not bleach",
  "Tumble dry low or line dry",
  "Iron inside out on low heat; never directly on the print",
];

export const productInfo = [
  "100% combed cotton, 240 GSM",
  "Water-based print, soft hand-feel",
  "Pre-shrunk; allow ±1 inch measurement tolerance",
  "Printed to order in 2–4 working days",
];
