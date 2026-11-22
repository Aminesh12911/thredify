import test from "node:test";
import assert from "node:assert/strict";
import { priceOrder, orderRequestSchema, maskCustomer } from "../src/lib/server/orderPricing.ts";

const catalog = [
  {
    id: "prod-1", name: "Grounded", price: 549, slogan: "grounded",
    sizes: ["S", "M", "L", "XL", "XXL"] as ("S" | "M" | "L" | "XL" | "XXL")[],
    colors: [{ name: "Olive", hex: "#667052" }, { name: "Sand", hex: "#D8CDB6" }],
  },
];
const customer = {
  name: "Test Customer", email: "t@example.com", phone: "9876543210",
  line1: "12 Sample Street", city: "Indore", state: "Madhya Pradesh", pin: "452001",
};
const base = { customer, method: "UPI", scenario: "success" } as const;
const textLayer = (over = {}) => ({ id: "a", kind: "text", side: "front", x: 50, y: 50, scale: 1, text: "Hi", font: "inter", fontSize: 22, color: "#252820", ...over });
const custom = (over = {}) => ({
  productId: null, size: "M", colorName: "Olive", quantity: 1,
  customization: { tshirtColor: { name: "Olive" }, fit: "Regular", layers: [textLayer()], ...over },
});
const parse = (items: unknown[], extra = {}) => orderRequestSchema.safeParse({ ...base, items, ...extra });

test("ignores client-sent prices: unitPrice/total fields are stripped and catalogue price wins", () => {
  const r = parse([{ productId: "prod-1", size: "M", colorName: "Olive", quantity: 2, unitPrice: 1, price: 1 }], { total: 1 });
  assert.ok(r.success);
  assert.ok(!("unitPrice" in r.data.items[0]) && !("total" in r.data));
  const p = priceOrder(r.data.items, null, catalog);
  assert.ok(p.ok);
  assert.equal(p.items[0].unitPrice, 549);
  assert.equal(p.totals.subtotal, 1098);
  assert.equal(p.totals.shipping, 0);
});

test("rejects unknown product, size and colour", () => {
  const price = (item: object) => {
    const r = parse([item]); assert.ok(r.success); return priceOrder(r.data.items, null, catalog);
  };
  assert.equal(price({ productId: "nope", size: "M", colorName: "Olive", quantity: 1 }).ok, false);
  assert.match((price({ productId: "prod-1", size: "M", colorName: "Pink", quantity: 1 }) as { error: string }).error, /colour Pink/);
  assert.equal(orderRequestSchema.safeParse({ ...base, items: [{ productId: "prod-1", size: "XS", colorName: "Olive", quantity: 1 }] }).success, false);
});

test("quantity must be an integer 1-10; cart must be non-empty and at most 20 lines", () => {
  const item = { productId: "prod-1", size: "M", colorName: "Olive" };
  for (const q of [0, 11, 1.5, -1]) assert.equal(parse([{ ...item, quantity: q }]).success, false, `qty ${q}`);
  assert.equal(parse([]).success, false);
  assert.equal(parse(Array(21).fill({ ...item, quantity: 1 })).success, false);
});

test("custom design is priced by the server rule, not the client", () => {
  const r = parse([custom()]); assert.ok(r.success);
  const p = priceOrder(r.data.items, null, catalog); assert.ok(p.ok);
  assert.equal(p.items[0].unitPrice, 649); // 549 + 1 side
  const two = parse([custom({ layers: [textLayer(), textLayer({ id: "b", side: "back" })], fit: "Oversized" })]); assert.ok(two.success);
  const p2 = priceOrder(two.data.items, null, catalog); assert.ok(p2.ok);
  assert.equal(p2.items[0].unitPrice, 549 + 200 + 50);
});

test("custom colour hex comes from the server palette", () => {
  const r = parse([custom()]); assert.ok(r.success);
  const p = priceOrder(r.data.items, null, catalog); assert.ok(p.ok);
  assert.equal(p.items[0].colorHex, "#667052");
  const bad = parse([custom({ tshirtColor: { name: "Hot Pink" } })]); assert.ok(bad.success);
  assert.equal(priceOrder(bad.data.items, null, catalog).ok, false);
});

test("custom layers are validated: empty list, bad font, bad colour, oversized/odd images, empty text", () => {
  assert.equal(parse([custom({ layers: [] })]).success, false);
  assert.equal(parse([custom({ layers: [textLayer({ font: "comic-sans" })] })]).success, false);
  assert.equal(parse([custom({ layers: [textLayer({ color: "red;}</style>" })] })]).success, false);
  assert.equal(parse([custom({ layers: [textLayer({ x: 500 })] })]).success, false);
  const img = (url: string) => parse([custom({ layers: [{ id: "i", kind: "image", side: "front", x: 50, y: 50, scale: 1, aspect: 1, imageDataUrl: url }] })]).success;
  assert.equal(img("data:image/png;base64,iVBORw0KGgo="), true);
  assert.equal(img("data:image/svg+xml;base64,PHN2Zz4="), false);
  assert.equal(img("https://evil.example/x.png"), false);
  assert.equal(img("data:text/html;base64,PGgxPg=="), false);
  assert.equal(img("data:image/png;base64," + "A".repeat(1_600_000)), false);
  const empty = parse([custom({ layers: [textLayer({ text: "   " })] })]); assert.ok(empty.success);
  assert.equal(priceOrder(empty.data.items, null, catalog).ok, false);
});

test("a custom design can't smuggle in a productId", () => {
  const r = parse([{ ...custom(), productId: "prod-1" }]); assert.ok(r.success);
  assert.equal(priceOrder(r.data.items, null, catalog).ok, false);
});

test("coupon is applied by the server rules", () => {
  const r = parse([{ productId: "prod-1", size: "M", colorName: "Olive", quantity: 1 }], { couponCode: "welcome10" }); assert.ok(r.success);
  const p = priceOrder(r.data.items, r.data.couponCode, catalog); assert.ok(p.ok);
  assert.equal(p.totals.discount, 55);
  assert.equal(p.totals.total, 549 - 55 + 79);
});

test("customer details are re-validated server-side (phone normalised, bad PIN rejected)", () => {
  const item = [{ productId: "prod-1", size: "M", colorName: "Olive", quantity: 1 }];
  const ok = parse(item, { customer: { ...customer, phone: "+91 98765-43210" } }); assert.ok(ok.success);
  assert.equal(ok.data.customer.phone, "9876543210");
  assert.equal(parse(item, { customer: { ...customer, pin: "012345" } }).success, false);
  assert.equal(parse(item, { customer: { ...customer, email: "nope" } }).success, false);
  assert.equal(parse(item, { customer: { ...customer, state: "Atlantis" } }).success, false);
});

test("lookup masking hides address, phone and most of the email", () => {
  const m = maskCustomer(customer);
  assert.equal(m.line1, "Address hidden for privacy");
  assert.equal(m.phone, "••••••3210");
  assert.equal(m.email, "t•••@example.com");
  assert.equal(m.name, "Test C.");
  assert.equal(m.pin, "452•••");
});
