import test from "node:test";
import assert from "node:assert/strict";
import { computeStats, buildCustomers, LOW_STOCK } from "../src/lib/admin/stats.ts";

const inv = (n: number) => ({ S: n, M: n, L: n, XL: n, XXL: n });
const pay = (status: "succeeded" | "failed" = "succeeded") => ({ status, provider: "x", reference: "r", method: "UPI" });
const order = (status: string, total: number, email = "a@x.io", createdAt = "2026-11-01T00:00:00Z", p = pay()) => ({
  status, total, payment: p, createdAt,
  customer: { name: "A", email, phone: "9876543210", line1: "l", city: "Indore", state: "MP", pin: "452001" },
}) as never;

test("revenue counts only paid, non-cancelled orders", () => {
  const s = computeStats([], [order("placed", 500), order("delivered", 700), order("cancelled", 900), order("placed", 100, "a@x.io", "", pay("failed"))]);
  assert.equal(s.revenue, 1200);
  assert.equal(s.totalOrders, 4);
});

test("pending = placed + processing + printing", () => {
  const s = computeStats([], [order("placed", 1), order("processing", 1), order("printing", 1), order("shipped", 1), order("delivered", 1), order("cancelled", 1)]);
  assert.equal(s.pending, 3);
  assert.equal(s.byStatus.shipped, 1);
});

test("inventory: units, low-stock boundary and out-of-stock", () => {
  const s = computeStats([{ id: "1", name: "Tee", inventory: { S: 0, M: LOW_STOCK, L: LOW_STOCK + 1, XL: 3, XXL: 50 } }], []);
  assert.equal(s.totalUnits, 0 + LOW_STOCK + LOW_STOCK + 1 + 3 + 50);
  assert.deepEqual(s.outOfStock, [{ name: "Tee", size: "S" }]);
  assert.deepEqual(s.lowStock.map((l) => l.size), ["XL", "M"]); // sorted lowest first, 11 is not low
  assert.equal(computeStats([{ id: "1", name: "T", inventory: inv(5) }, { id: "2", name: "U", inventory: inv(5) }], []).totalProducts, 2);
});

test("customers are grouped by email (case-insensitive), cancelled orders add no spend", () => {
  const c = buildCustomers([order("delivered", 600, "Ann@x.io", "2026-11-01"), order("placed", 400, "ann@x.io", "2026-11-05"), order("cancelled", 999, "ann@x.io", "2026-11-06"), order("placed", 100, "bo@x.io", "2026-11-02")], []);
  const ann = c.find((x) => x.email === "ann@x.io")!;
  assert.equal(c.length, 2);
  assert.equal(ann.orders, 3);
  assert.equal(ann.spent, 1000);
  assert.equal(ann.lastOrder, "2026-11-06");
});

test("registered accounts with no orders still appear, and flag hasAccount", () => {
  const c = buildCustomers([order("placed", 100, "bo@x.io")], [{ email: "BO@x.io", name: "Bo", phone: "" }, { email: "new@x.io", name: "New", phone: "" }]);
  assert.equal(c.length, 2);
  assert.equal(c.find((x) => x.email === "bo@x.io")!.hasAccount, true);
  assert.equal(c.find((x) => x.email === "new@x.io")!.orders, 0);
});
