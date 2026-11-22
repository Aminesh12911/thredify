export type Size = "S" | "M" | "L" | "XL" | "XXL";
export const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export type Style = "Minimal" | "Typographic" | "Illustrated" | "Essentials";

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number; // INR, whole rupees
  category: string;
  style: Style;
  description: string;
  colors: ProductColor[];
  sizes: Size[];
  stock: number;
  createdAt: string; // ISO date
  featured: boolean;
  slogan: string; // printed graphic text used by mockup generator
}

export interface CustomizationLayer {
  id: string;
  kind: "text" | "image";
  side: "front" | "back";
  x: number; // % of print area
  y: number;
  scale: number;
  text?: string;
  font?: string;
  fontSize?: number;
  color?: string;
  imageDataUrl?: string;
  aspect?: number; // width / height of the uploaded image
}

export interface Customization {
  tshirtColor: ProductColor;
  fit: "Regular" | "Oversized" | "Slim";
  layers: CustomizationLayer[];
}

export interface CartItem {
  id: string; // unique line id
  productId: string | null; // null for custom designs
  name: string;
  unitPrice: number;
  quantity: number;
  size: Size;
  colorName: string;
  colorHex: string;
  slogan?: string;
  customization?: Customization;
}

export type OrderStatus = "placed" | "processing" | "printing" | "shipped" | "delivered" | "cancelled";

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pin: string;
}

export interface OrderPayment {
  status: "succeeded" | "failed";
  provider: string; // always a sandbox/simulator in this project
  reference: string; // fake test reference, never card data
  method: string;
}

export interface Order {
  code: string;
  createdAt: string;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  payment: OrderPayment;
  status: OrderStatus;
  imagesStripped?: boolean; // uploaded artwork dropped because browser storage was full
}
