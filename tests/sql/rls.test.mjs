import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const root = new URL("../../supabase/", import.meta.url).pathname;
let schema = readFileSync(root + "schema.sql", "utf8");
const seed = readFileSync(root + "seed.sql", "utf8");
const db = new PGlite();
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail !== "" ? " — " + detail : ""}`); };
const q = async (sql, params) => (await db.query(sql, params)).rows;
const tryq = async (sql, params) => { try { return { rows: await q(sql, params) }; } catch (e) { return { error: e }; } };

// --- Minimal stand-ins for what Supabase provides ---
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  grant select on auth.users to anon, authenticated, service_role;
`);
try { await db.exec(schema); }
catch (e) {
  if (/pgcrypto/i.test(String(e.message))) { schema = schema.replace(/create extension[^;]*pgcrypto[^;]*;/i, ""); await db.exec(schema); console.log("(note: pgcrypto stripped for PGlite; gen_random_uuid is built into Postgres 13+)"); }
  else throw e;
}
check("schema.sql executes cleanly", true);
await db.exec(seed); await db.exec(seed); // run twice: must be idempotent
const c = async (t) => Number((await q(`select count(*)::int n from public.${t}`))[0].n);
check("seed.sql loads (and re-runs idempotently)", (await c("products")) === 6 && (await c("inventory")) === 30 && (await c("categories")) === 4, `${await c("products")}/${await c("inventory")}/${await c("categories")}`);
const stock = await q(`select p.slug, sum(i.stock)::int s from products p join inventory i on i.product_id=p.id group by 1 order by 1`);
check("seed stock totals match app seed data", stock.find(r => r.slug === "grounded")?.s === 62 && stock.find(r => r.slug === "everyday-essential")?.s === 120, JSON.stringify(stock.slice(0, 2)));

// --- users + profile trigger ---
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
for (const [id, n] of [[A, "Asha"], [B, "Ben"], [C, "Chitra"]]) await db.query(`insert into auth.users (id,email,raw_user_meta_data) values ($1,$2,$3)`, [id, n.toLowerCase() + "@example.com", JSON.stringify({ full_name: n + " Test" })]);
const prof = await q(`select id, full_name, role from public.profiles order by full_name`);
check("signup trigger creates a 'customer' profile with the name", prof.length === 3 && prof.every(p => p.role === "customer") && prof[0].full_name === "Asha Test", JSON.stringify(prof.map(p => p.role)));

const as = async (role, uid, fn) => { await db.exec(`set role ${role}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ""]); try { return await fn(); } finally { await db.exec(`reset role`); await db.query(`select set_config('request.jwt.claim.sub','',false)`); } };

// --- create_order ---
const prodId = (await q(`select id from products where slug='grounded'`))[0].id;
const payload = (code, userId, over = {}) => ({
  order_code: code, user_id: userId, customer_name: "Test Customer", email: "t@example.com", phone: "9876543210",
  ship_line1: "12 Sample Street", ship_city: "Indore", ship_state: "Madhya Pradesh", ship_pin: "452001",
  subtotal_inr: 1198, shipping_inr: 0, discount_inr: 0, total_inr: 1198, coupon_code: null, payment_reference: "SBX-TEST1234", payment_method: "UPI",
  items: [
    { product_id: prodId, name: "Grounded", size: "M", color_name: "Olive", quantity: 1, unit_price_inr: 549, customization: null },
    { product_id: null, name: "Custom T-shirt", size: "L", color_name: "Olive", quantity: 1, unit_price_inr: 649, customization: { fit: "Regular", tshirt_color: "Olive", layers: [{ id: "a", kind: "text", side: "front", text: "Hi" }] } },
  ], ...over,
});
const call = (p) => db.query(`select public.create_order($1::jsonb) as code`, [JSON.stringify(p)]);
const seedM = (await q(`select stock from inventory where product_id=$1 and size='M'`, [prodId]))[0].stock;
const r1 = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb) as code`, [JSON.stringify(payload("THR-20261121-AAAAAAAA", A))]));
check("service_role can create an order", r1.rows?.[0]?.code === "THR-20261121-AAAAAAAA", r1.error?.message);
check("order, 2 items, 1 customization, 1 payment written", (await c("orders")) === 1 && (await c("order_items")) === 2 && (await c("customizations")) === 1 && (await c("payments")) === 1);
const pay = (await q(`select provider,status,method,test_reference from payments`))[0];
check("payment row stores test metadata only (method, reference)", pay.provider === "sandbox-simulator" && pay.status === "succeeded" && pay.method === "UPI" && pay.test_reference === "SBX-TEST1234", JSON.stringify(pay));
const cols = await q(`select column_name from information_schema.columns where table_schema='public' and table_name in ('payments','orders','customizations') `);
check("no card/CVV/credential columns anywhere", !cols.some(x => /card|cvv|pan|secret|password/i.test(x.column_name)), cols.map(x => x.column_name).filter(n => /card|cvv|pan|secret|password/i.test(n)).join(","));

const before = [await c("orders"), await c("order_items"), await c("payments")];
const bad = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-BBBBBBBB", B, { items: [payload("x", B).items[0], { ...payload("x", B).items[0], quantity: 0 }] }))]));
check("atomic: a bad 2nd item rolls the whole order back", !!bad.error && [await c("orders"), await c("order_items"), await c("payments")].join() === before.join(), bad.error?.message?.slice(0, 60));
const dup = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-AAAAAAAA", A))]));
check("duplicate order code raises 23505 (API retries on this)", dup.error?.code === "23505", dup.error?.code);
check("…and the failed duplicate left no partial rows", (await c("orders")) === 1 && (await c("order_items")) === 2);
await as("service_role", null, () => call(payload("THR-20261121-CCCCCCCC", B, { items: [payload("x", B).items[0]], subtotal_inr: 549, total_inr: 549 })));

// --- stock handling in create_order ---
const stockOf = async (size) => (await q(`select stock from inventory where product_id=$1 and size=$2`, [prodId, size]))[0].stock;
const mBefore = await stockOf("M");
check("successful orders decremented catalogue stock (seed M minus 2 orders x 1 unit)", mBefore === seedM - 2, `${seedM} -> ${mBefore}`);
const sBefore = await stockOf("S"), lBefore = await stockOf("L");
const rollback = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-STOCKBAD", B, { items: [{ ...payload("x", B).items[0], size: "S", quantity: 1 }, { ...payload("x", B).items[0], size: "L", quantity: 9999 }] }))]));
check("over-ordering raises insufficient_stock (SQLSTATE TH001) naming the item", rollback.error?.code === "TH001" && /Grounded \(L\)/.test(rollback.error?.detail ?? ""), rollback.error?.code + " " + rollback.error?.detail);
check("…and rolls back everything: no order row, earlier line's stock restored", (await q(`select count(*)::int n from orders where order_code='THR-20261121-STOCKBAD'`))[0].n === 0 && (await stockOf("S")) === sBefore && (await stockOf("L")) === lBefore);
const last = await stockOf("XXL");
await as("service_role", null, () => call(payload("THR-20261121-LASTONE1", B, { items: [{ ...payload("x", B).items[0], size: "XXL", quantity: last }] })));
check("buying exactly the remaining units succeeds and leaves 0", (await stockOf("XXL")) === 0);
const oversell = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-LASTONE2", B, { items: [{ ...payload("x", B).items[0], size: "XXL", quantity: 1 }] }))]));
check("the next buyer of a sold-out size is refused (cannot oversell)", oversell.error?.code === "TH001");
const totalStock = async () => (await q(`select sum(stock)::int s from inventory`))[0].s;
const tBefore = await totalStock();
const customOnly = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-CUSTOMONLY", B, { items: [payload("x", B).items[1], { ...payload("x", B).items[1], quantity: 5 }] }))]));
check("custom (made-to-order) items don't touch stock", !customOnly.error && (await totalStock()) === tBefore, customOnly.error?.message);
const dupLines = await as("service_role", null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-DUPLINES", B, { items: [{ ...payload("x", B).items[0], size: "L", quantity: lBefore }, { ...payload("x", B).items[0], size: "L", quantity: 1 }] }))]));
check("two cart lines of the same size can't jointly exceed stock", dupLines.error?.code === "TH001" && (await stockOf("L")) === lBefore);
// remove the helper orders created above so the RLS counts below stay as designed
await db.exec(`delete from public.orders where order_code in ('THR-20261121-LASTONE1','THR-20261121-CUSTOMONLY')`);

// --- RLS ---
for (const role of ["anon", "authenticated"]) {
  const r = await as(role, role === "authenticated" ? A : null, () => tryq(`select public.create_order($1::jsonb)`, [JSON.stringify(payload("THR-20261121-HACKHACK", A))]));
  check(`${role} CANNOT call create_order`, !!r.error && /permission denied/i.test(r.error.message), r.error?.message?.slice(0, 50));
}
const aOrders = await as("authenticated", A, () => q(`select order_code from orders`));
check("customer A sees only their own order", aOrders.length === 1 && aOrders[0].order_code === "THR-20261121-AAAAAAAA", JSON.stringify(aOrders));
const aItems = await as("authenticated", A, () => q(`select count(*)::int n from order_items`));
const aCust = await as("authenticated", A, () => q(`select count(*)::int n from customizations`));
const bCust = await as("authenticated", B, () => q(`select count(*)::int n from customizations`));
check("order_items / customizations are scoped to the owner", aItems[0].n === 2 && aCust[0].n === 1 && bCust[0].n === 0, `A items=${aItems[0].n} A cust=${aCust[0].n} B cust=${bCust[0].n}`);
const bPay = await as("authenticated", B, () => q(`select count(*)::int n from payments`));
check("customer B can't see A's payments (sees only their own 1)", bPay[0].n === 1);
const ins = await as("authenticated", A, () => tryq(`insert into orders (order_code,customer_name,email,phone,ship_line1,ship_city,ship_state,ship_pin,subtotal_inr,shipping_inr,total_inr) values ('THR-FAKE','x','x@x.io','9876543210','addr','c','s','452001',1,0,1)`));
check("customer cannot insert an order directly (must go through server)", !!ins.error, ins.error?.message?.slice(0, 60));
const upd = await as("authenticated", A, async () => { await db.exec(`update orders set status='delivered', total_inr=1`); return q(`select status,total_inr from orders`); });
check("customer cannot change order status/total", upd[0].status === "placed" && upd[0].total_inr === 1198, JSON.stringify(upd[0]));
const anonOrders = await as("anon", null, () => tryq(`select * from orders`));
check("anon sees no orders", (anonOrders.rows?.length ?? 0) === 0);

const esc = await as("authenticated", A, () => tryq(`update profiles set role='admin' where id='${A}'`));
const roleNow = (await q(`select role from profiles where id=$1`, [A]))[0].role;
check("customer CANNOT promote themselves to admin", roleNow === "customer", `${esc.error ? "rejected: " + esc.error.message.slice(0, 50) : "0 rows updated"}; role=${roleNow}`);
const ok = await as("authenticated", A, async () => { await db.exec(`update profiles set full_name='Asha R', phone='9876543210' where id='${A}'`); return q(`select full_name from profiles where id='${A}'`); });
check("customer CAN edit their own name/phone", ok[0].full_name === "Asha R");
const others = await as("authenticated", A, () => q(`select id from profiles`));
check("customer sees only their own profile", others.length === 1 && others[0].id === A);
const steal = await as("authenticated", A, async () => { await db.exec(`update profiles set full_name='HACKED' where id='${B}'`); return null; });
check("customer cannot edit someone else's profile", (await q(`select full_name from profiles where id=$1`, [B]))[0].full_name === "Ben Test");

const prods = await as("anon", null, () => q(`select count(*)::int n from products`));
check("anon can read the catalogue", prods[0].n === 6);
const wp = await as("anon", null, () => tryq(`insert into products (slug,name,description,price_inr,style) values ('x','x','x',1,'x')`));
check("anon cannot write products", !!wp.error);
const wc = await as("authenticated", A, () => tryq(`update products set price_inr=1`));
check("customer cannot change prices", (await q(`select min(price_inr)::int m from products`))[0].m >= 499);
const enq = await as("anon", null, () => tryq(`insert into enquiries (name,email,message,kind) values ('Guest','g@example.com','Hello','custom_design')`));
check("anyone can submit an enquiry", !enq.error, enq.error?.message);
const readEnq = await as("anon", null, () => q(`select * from enquiries`));
const readEnqU = await as("authenticated", A, () => q(`select * from enquiries`));
check("only admins can read enquiries (anon & customer see none)", readEnq.length === 0 && readEnqU.length === 0);

const addr = await as("authenticated", A, () => tryq(`insert into addresses (user_id,line1,city,state,pin_code) values ('${A}','12 Sample St','Indore','MP','452001')`));
check("customer can save their own address", !addr.error, addr.error?.message);
const addrB = await as("authenticated", A, () => tryq(`insert into addresses (user_id,line1,city,state,pin_code) values ('${B}','x street','c','s','452001')`));
check("customer cannot create an address for someone else", !!addrB.error);
const pin = await as("authenticated", A, () => tryq(`insert into addresses (user_id,line1,city,state,pin_code) values ('${A}','12 Sample St','Indore','MP','012345')`));
check("invalid PIN rejected by a database constraint", !!pin.error);
const seeB = await as("authenticated", B, () => q(`select * from addresses`));
check("addresses are private to their owner", seeB.length === 0);

// --- admin ---
await db.exec(`update public.profiles set role='admin' where id='${C}'`);
const adm = await as("authenticated", C, async () => ({
  orders: (await q(`select count(*)::int n from orders`))[0].n,
  enq: (await q(`select count(*)::int n from enquiries`))[0].n,
  profiles: (await q(`select count(*)::int n from profiles`))[0].n,
}));
check("admin sees ALL orders, enquiries and profiles", adm.orders === 2 && adm.enq === 1 && adm.profiles === 3, JSON.stringify(adm));
await as("authenticated", C, () => db.exec(`update orders set status='shipped' where order_code='THR-20261121-AAAAAAAA'`));
check("admin can update order status", (await q(`select status from orders where order_code='THR-20261121-AAAAAAAA'`))[0].status === "shipped");
const ap = await as("authenticated", C, () => tryq(`insert into products (slug,name,description,price_inr,style) values ('new-tee','New Tee','d',499,'Minimal') returning id`));
check("admin can add products", !ap.error, ap.error?.message);
await as("authenticated", C, () => db.exec(`update inventory set stock=7 where product_id='${prodId}' and size='M'`));
check("admin can manage stock", (await q(`select stock from inventory where product_id=$1 and size='M'`, [prodId]))[0].stock === 7);
const adminEsc = await as("authenticated", C, () => tryq(`update profiles set role='customer' where id='${C}'`));
check("even an admin cannot change role through the API (role is changed in SQL only)", (await q(`select role from profiles where id=$1`, [C]))[0].role === "admin");

// --- admin product-save flow (the exact statements src/lib/admin/api.ts issues) ---
const catIns = await as("authenticated", C, () => tryq(`insert into categories (name, slug) values ('Limited Drops','limited-drops') returning id`));
check("admin can create a category", !catIns.error, catIns.error?.message);
const catId = catIns.rows?.[0]?.id ?? (await q(`select id from categories where slug='limited-drops'`))[0]?.id;
const np = await as("authenticated", C, () => tryq(`insert into products (slug,name,description,price_inr,style,slogan,colors,featured,category_id) values ('flow-tee','Flow Tee','d',650,'Bold','flow',$$[{"name":"Olive","hex":"#667052"}]$$::jsonb,true,'${catId}') returning id`));
check("admin product insert with category/colours/featured works", !np.error, np.error?.message);
const npId = np.rows?.[0]?.id ?? (await q(`select id from products where slug='flow-tee'`))[0].id;
const invUp = await as("authenticated", C, () => tryq(`insert into inventory (product_id,size,stock) values ('${npId}','S',5),('${npId}','M',3) on conflict (product_id,size) do update set stock=excluded.stock`));
check("admin inventory upsert works", !invUp.error, invUp.error?.message);
await as("authenticated", C, () => db.exec(`insert into inventory (product_id,size,stock) values ('${npId}','S',9) on conflict (product_id,size) do update set stock=excluded.stock; update products set price_inr=700 where id='${npId}'`));
check("admin re-save updates stock and price (no duplicate rows)", (await q(`select count(*)::int n from inventory where product_id=$1`, [npId]))[0].n === 2 && (await q(`select stock from inventory where product_id=$1 and size='S'`, [npId]))[0].stock === 9 && (await q(`select price_inr::int p from products where id=$1`, [npId]))[0].p === 700);
const dupSlug = await as("authenticated", C, () => tryq(`insert into products (slug,name,description,price_inr,style) values ('flow-tee','Dup','d',1,'Bold')`));
check("duplicate product slug rejected by the database", !!dupSlug.error);
const negStock = await as("authenticated", C, () => tryq(`update inventory set stock=-1 where product_id='${npId}' and size='S'`));
check("negative stock rejected by a constraint", !!negStock.error);
const custIns = await as("authenticated", A, () => tryq(`insert into categories (name, slug) values ('Hack','hack')`));
const custInv = await as("authenticated", A, async () => { await db.exec(`update inventory set stock=999 where product_id='${npId}'`); return null; });
const custDel = await as("authenticated", A, async () => { await db.exec(`delete from products where id='${npId}'`); return null; });
check("customer cannot create categories, change stock or delete products", !!custIns.error && (await q(`select stock from inventory where product_id=$1 and size='S'`, [npId]))[0].stock === 9 && (await q(`select count(*)::int n from products where id=$1`, [npId]))[0].n === 1);
await as("authenticated", C, () => db.exec(`delete from products where id='${npId}'`));
check("admin delete removes the product and cascades its inventory", (await q(`select count(*)::int n from products where id=$1`, [npId]))[0].n === 0 && (await q(`select count(*)::int n from inventory where product_id=$1`, [npId]))[0].n === 0);
const emails = await q(`select email from profiles order by email`);
check("signup trigger copies the email into profiles", emails.length === 3 && emails[0].email === "asha@example.com", JSON.stringify(emails));
const listAcc = await as("authenticated", C, () => q(`select email, full_name, phone, role from profiles`));
check("admin can list accounts (email, name, phone, role)", listAcc.length === 3);
const listAccU = await as("authenticated", A, () => q(`select email from profiles`));
check("customer cannot list other accounts' emails", listAccU.length === 1 && listAccU[0].email === "asha@example.com");

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
