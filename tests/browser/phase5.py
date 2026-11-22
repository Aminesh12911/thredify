from playwright.sync_api import sync_playwright
import json, base64, re
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))
def num(s): return int(re.sub(r"[^\d]","",s))

with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    total=lambda: num(pg.get_by_test_id("grand-total").first.inner_text())
    summary=lambda lbl: pg.locator(f"aside dt:has-text('{lbl}') + dd").first.inner_text()

    # empty states
    pg.goto(B+"/cart"); pg.wait_for_selector("text=Your cart is empty"); check("empty cart state", True)
    pg.goto(B+"/checkout"); pg.wait_for_selector("text=Add something before checking out."); check("empty checkout state", True)

    # add products: Grounded M x1 (549) via PDP
    pg.goto(B+"/shop/grounded"); pg.get_by_role("button",name="M",exact=True).click(); pg.get_by_role("button",name="Add to cart").click()
    # custom tee via studio
    pg.goto(B+"/studio"); pg.wait_for_selector("svg[role=img]")
    pg.get_by_role("button",name="Olive",exact=True).click(); pg.get_by_role("button",name="Add text").click(); pg.fill("#txt","Cart test")
    png=base64.b64decode(pg.evaluate("""async()=>{const c=document.createElement('canvas');c.width=300;c.height=300;const x=c.getContext('2d');x.fillStyle='#B87958';x.fillRect(0,0,300,300);const b=await new Promise(r=>c.toBlob(r,'image/png'));const u=new Uint8Array(await b.arrayBuffer());let s='';u.forEach(v=>s+=String.fromCharCode(v));return btoa(s)}"""))
    pg.set_input_files("#art-upload",{"name":"a.png","mimeType":"image/png","buffer":png}); pg.wait_for_selector("svg[role=img] image")
    pg.get_by_role("button",name="L",exact=True).first.click(); pg.get_by_role("button",name="Add to cart ·").click()

    pg.goto(B+"/cart"); pg.wait_for_selector("ul[aria-label='Cart items']")
    check("cart lists 2 lines", pg.locator("ul[aria-label='Cart items'] > li").count()==2)
    check("custom line shows details", pg.get_by_text("Front print: ").first.is_visible() and "uploaded image" in pg.locator("ul[aria-label='Customisation details']").inner_text() and "Cart test" in pg.locator("ul[aria-label='Customisation details']").inner_text(), pg.locator("ul[aria-label='Customisation details']").inner_text())
    check("custom line shows its own artwork thumbnail", pg.locator("ul[aria-label='Cart items'] li").nth(1).locator("svg image").count()==1)
    check("subtotal 549+649=1198, free shipping", num(summary("Subtotal"))==1198 and summary("Shipping")=="Free", (summary("Subtotal"),summary("Shipping")))
    check("total 1198", total()==1198, total())

    # quantity
    pg.get_by_role("button",name="Increase quantity of Grounded").click(); check("qty+1 -> subtotal 1747", num(summary("Subtotal"))==1747, summary("Subtotal"))
    pg.get_by_role("button",name="Decrease quantity of Grounded").click(); check("qty-1 -> 1198", num(summary("Subtotal"))==1198)
    pg.get_by_role("button",name="Decrease quantity of Grounded").click() if False else None
    check("qty minus disabled at 1", pg.get_by_role("button",name="Decrease quantity of Grounded").is_disabled())

    # coupons
    pg.fill("#coupon","bogus"); pg.get_by_role("button",name="Apply").click(); check("invalid coupon error", pg.get_by_text("That code isn't valid.").is_visible())
    pg.fill("#coupon",""); pg.get_by_role("button",name="Apply").click(); check("empty coupon error", pg.get_by_text("Enter a coupon code.").is_visible())
    pg.fill("#coupon"," welcome10 "); pg.get_by_role("button",name="Apply").click()
    check("WELCOME10: discount 120 -> total 1078", total()==1078 and "120" in summary("Discount"), (total(),))
    pg.reload(); pg.wait_for_selector("ul[aria-label='Cart items']"); check("coupon persists after reload", total()==1078, total())
    pg.get_by_role("button",name="Remove",exact=True).last.click() if False else None
    pg.locator("aside button:has-text('Remove')").first.click(); check("coupon removed -> 1198", total()==1198, total())
    pg.fill("#coupon","FREESHIP"); pg.get_by_role("button",name="Apply").click(); check("FREESHIP accepted (shipping already free)", total()==1198 and "FREESHIP applied" in pg.locator("aside").inner_text())
    pg.locator("aside button:has-text('Remove')").first.click()

    # remove custom item -> shipping + min-order coupon rule
    pg.get_by_role("button",name="Remove Custom T-shirt from cart").click()
    check("after remove: 1 line, 549 + ₹79 shipping = 628", pg.locator("ul[aria-label='Cart items'] > li").count()==1 and total()==628 and num(summary("Shipping"))==79, total())
    check("free-shipping nudge shown", pg.get_by_text("more for free shipping").is_visible(), pg.get_by_text("more for free shipping").inner_text())
    pg.fill("#coupon","FLAT100"); pg.get_by_role("button",name="Apply").click(); check("FLAT100 rejected under 799", pg.get_by_text("minimum order").first.is_visible() and total()==628)
    # re-add custom via studio quickly (text only) to proceed
    pg.goto(B+"/studio"); pg.wait_for_selector("svg[role=img]"); pg.get_by_role("button",name="Add text").click()
    pg.get_by_role("button",name="M",exact=True).first.click(); pg.get_by_role("button",name="Add to cart ·").click()
    pg.goto(B+"/cart"); pg.wait_for_selector("ul[aria-label='Cart items']")
    pg.fill("#coupon","FLAT100"); pg.get_by_role("button",name="Apply").click()
    check("FLAT100 ok at 549+649=1198 -> 1098", total()==1098, total())
    pg.locator("aside button:has-text('Remove')").first.click()

    # checkout validation
    pg.get_by_role("link",name="Proceed to checkout").click(); pg.wait_for_url("**/checkout")
    check("demo/no-card notice shown", pg.get_by_text("Demo store — no real payments.").is_visible())
    check("no card/CVV inputs anywhere", pg.locator("input[autocomplete^='cc-'], input[name*='card' i], input[name*='cvv' i]").count()==0)
    pg.get_by_role("button",name=re.compile("^Pay ")).click(); pg.wait_for_timeout(200)
    check("empty submit shows 7 errors", pg.locator("p[role=alert][id$='-error']").count()==7, pg.locator("p[role=alert][id$='-error']").count())
    check("focus moves to first invalid field", pg.evaluate("document.activeElement.id")=="name")
    pg.fill("#name","Test Customer"); pg.fill("#email","bad@"); pg.fill("#phone","12345"); pg.fill("#line1","12 Sample Street"); pg.fill("#city","Indore"); pg.select_option("#state","Madhya Pradesh"); pg.fill("#pin","052001")
    pg.get_by_role("button",name=re.compile("^Pay ")).click(); pg.wait_for_timeout(200)
    msgs=pg.locator("p[role=alert][id$='-error']").all_inner_texts()
    check("bad email/phone/PIN flagged", any("email" in m for m in msgs) and any("mobile" in m for m in msgs) and any("PIN" in m for m in msgs) and len(msgs)==3, msgs)
    check("field marked aria-invalid", pg.locator("#email").get_attribute("aria-invalid")=="true")
    pg.fill("#email","test.customer@example.com"); check("error clears on edit", pg.locator("#email-error").count()==0)
    pg.fill("#phone","+91 98765-43210"); pg.fill("#pin","452001")

    # payment failure x2 (cart must be kept, no order)
    for scen,label in (("declined","declined"),("error","timed out")):
        pg.locator(f"input[name=scenario][value={scen}]").check(force=True); pg.get_by_role("button",name=re.compile("^Pay ")).click()
        check(f"{scen}: button shows processing + disabled", pg.get_by_role("button",name="Processing test payment…").is_disabled())
        pg.wait_for_function("document.querySelector('[data-testid=pay-error]').innerText.length>0", timeout=5000)
        check(f"{scen}: error message shown, stays on checkout", label in pg.get_by_test_id("pay-error").inner_text() and "/checkout" in pg.url, pg.get_by_test_id("pay-error").inner_text())
        check(f"{scen}: cart kept, no order saved", len(json.loads(pg.evaluate("localStorage.getItem('threadify-cart-v1')")))==2 and pg.evaluate("localStorage.getItem('threadify-orders-v1')") is None)
        check(f"{scen}: form data retained", pg.input_value("#name")=="Test Customer")

    # success: double-click guard
    pg.locator("input[name=scenario][value=success]").check(force=True); pg.locator("label:has-text('Card')").first.click()
    btn=pg.get_by_role("button",name=re.compile("^Pay ")); btn.dblclick()
    pg.wait_for_url("**/order/THR-*", timeout=8000)
    orders=json.loads(pg.evaluate("localStorage.getItem('threadify-orders-v1')"))
    check("success: exactly 1 order despite double-click", len(orders)==1, len(orders))
    o=orders[0]; code=o["code"]
    check("order id format THR-YYYYMMDD-XXXXX", re.fullmatch(r"THR-\d{8}-[A-HJ-NP-Z2-9]{5}", code), code)
    check("order saved with totals/payment/customer", o["total"]==1198 and o["payment"]["status"]=="succeeded" and o["payment"]["method"]=="Card" and o["customer"]["phone"]=="9876543210" and o["customer"]["email"]=="test.customer@example.com" and len(o["items"])==2, {k:o[k] for k in ("total","subtotal","shipping")})
    s=json.dumps(o).lower(); check("no card/cvv data in stored order", not re.search(r"cvv|cardnumber|card_number|\b\d{13,19}\b", s))
    check("cart + coupon cleared after order", json.loads(pg.evaluate("localStorage.getItem('threadify-cart-v1')"))==[] and pg.evaluate("localStorage.getItem('threadify-coupon-v1')") in ("null",None))
    pg.wait_for_selector("[data-testid=order-code]")
    check("confirmation shows code, status, paid, total", pg.get_by_test_id("order-code").inner_text()==code and pg.get_by_test_id("order-status").inner_text()=="Order placed" and pg.get_by_text("Paid (simulated)").is_visible() and "1,198" in pg.locator("[aria-label=Totals]").inner_text())
    check("confirmation lists purchased products", pg.get_by_text("Grounded × 1").is_visible() and pg.get_by_text("Custom T-shirt × 1").is_visible())
    check("header cart count cleared", pg.locator("header a[href='/cart']").inner_text().strip()=="Cart", pg.locator("header a[href='/cart']").inner_text())

    # tracking
    pg.goto(B+"/track"); pg.wait_for_selector("#order-code")
    pg.fill("#order-code","THR-00000000-XXXXX"); pg.get_by_role("button",name="Track order").click(); check("unknown order -> not found", pg.get_by_text("We couldn't find that order").is_visible())
    pg.fill("#order-code",f"  {code.lower()}  "); pg.get_by_role("button",name="Track order").click()
    check("track by id (case/space-insensitive)", pg.get_by_test_id("order-status").inner_text()=="Order placed")
    for expect in ("Processing","Printing","Shipped","Delivered"):
        pg.get_by_role("button",name="Advance demo status").click() if expect!="Delivered" or True else None
        check(f"status -> {expect}", pg.get_by_test_id("order-status").inner_text()==expect)
    check("no advance button when delivered", pg.get_by_role("button",name="Advance demo status").count()==0)
    pg.goto(f"{B}/track?code={code}"); pg.wait_for_selector("[data-testid=order-status]"); check("deep link ?code= works + status persisted", pg.get_by_test_id("order-status").inner_text()=="Delivered")
    pg.goto(f"{B}/order/{code}"); pg.wait_for_selector("[data-testid=order-status]"); check("confirmation URL reopens order", pg.get_by_test_id("order-code").inner_text()==code)

    # mobile
    mc=br.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True); m=mc.new_page()
    m.goto(B+"/shop/everyday-essential"); m.get_by_role("button",name="S",exact=True).click(); m.get_by_role("button",name="Add to cart").click()
    for path in ("/cart","/checkout"):
        m.goto(B+path); m.wait_for_selector("main h1"); m.wait_for_timeout(300)
        w=m.evaluate("[document.documentElement.scrollWidth, window.innerWidth]"); check(f"mobile no overflow {path}", w[0]<=w[1], w)
    small=m.locator("main button:visible, main input:not([type=radio]):visible, main select:visible, main a:visible, main label:has(input[type=radio])").evaluate_all("els=>els.filter(e=>!e.className.includes('sr-only')).map(e=>{const r=e.getBoundingClientRect();return [e.tagName+':'+(e.id||e.textContent.trim().slice(0,12)),Math.round(r.width),Math.round(r.height)]}).filter(a=>a[2]<40)")
    check("mobile checkout controls (incl. radio labels) >=40px tall", len(small)==0, small[:5])
    m.goto(B+"/cart"); m.wait_for_selector("ul[aria-label='Cart items']"); m.fill("#coupon","welcome10"); m.get_by_role("button",name="Apply").click(); check("mobile coupon works", "WELCOME10 applied" in m.locator("aside").inner_text())
    check("no JS page errors", not errs, errs[:3])
    br.close()
print(f"\n{sum(o for _,o in res)}/{len(res)} passed")
