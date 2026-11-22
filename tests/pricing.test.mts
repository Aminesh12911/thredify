import test from "node:test";
import assert from "node:assert/strict";
import { computeTotals, couponStatus, FLAT_SHIPPING } from "../src/lib/cart/pricing.ts";

const line = (unitPrice: number, quantity = 1) => ({ unitPrice, quantity });

test("empty cart has zero totals and no shipping", () => {
  assert.deepEqual(computeTotals([], null), {
    subtotal: 0, discount: 0, shipping: 0, total: 0, couponApplied: null, couponNote: null,
  });
});

test("single item below the free-shipping threshold pays flat shipping", () => {
  const t = computeTotals([line(599)], null);
  assert.equal(t.shipping, FLAT_SHIPPING);
  assert.equal(t.total, 599 + FLAT_SHIPPING);
});

test("free shipping at exactly 999 and above", () => {
  assert.equal(computeTotals([line(999)], null).shipping, 0);
  assert.equal(computeTotals([line(998)], null).shipping, FLAT_SHIPPING);
  assert.equal(computeTotals([line(599), line(499)], null).shipping, 0);
});

test("quantity multiplies into the subtotal", () => {
  assert.equal(computeTotals([line(549, 3)], null).subtotal, 1647);
});

test("WELCOME10 takes 10% rounded to whole rupees (case-insensitive)", () => {
  const t = computeTotals([line(599)], " welcome10 ");
  assert.equal(t.discount, 60);
  assert.equal(t.couponApplied, "WELCOME10");
  assert.equal(t.total, 599 - 60 + FLAT_SHIPPING);
});

test("FLAT100 needs a 799 minimum", () => {
  assert.equal(couponStatus("FLAT100", 700).valid, false);
  const low = computeTotals([line(599)], "FLAT100");
  assert.equal(low.discount, 0);
  assert.match(low.couponNote ?? "", /minimum order/);
  assert.equal(computeTotals([line(649), line(499)], "FLAT100").discount, 100);
});

test("FREESHIP removes shipping", () => {
  const t = computeTotals([line(599)], "FREESHIP");
  assert.equal(t.shipping, 0);
  assert.equal(t.total, 599);
});

test("unknown code is rejected and charges full price", () => {
  const t = computeTotals([line(599)], "NOPE");
  assert.equal(t.discount, 0);
  assert.equal(t.couponApplied, null);
  assert.equal(t.couponNote, "That code isn't valid.");
});

test("discount never exceeds the subtotal", () => {
  const t = computeTotals([line(50)], "FLAT100");
  assert.ok(t.discount <= t.subtotal);
  assert.ok(t.total >= 0);
});
