from playwright.sync_api import sync_playwright
import json
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, ok)); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))

with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    bad=[]; pg.on("response", lambda r: r.status>=400 and bad.append((r.status, r.url.replace(B,""))))
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
    names=lambda: pg.locator("main article h3").all_inner_texts()

    pg.goto(B+"/shop"); pg.wait_for_selector("main article")
    check("shop shows 6 products", len(names())==6, names())
    pg.fill("#shop-search","quiet"); check("search 'quiet' matches name + description", sorted(names())==["The Quiet Type","Unfiltered"], names())
    pg.fill("#shop-search","quiet type"); check("search 'quiet type' -> 1", names()==["The Quiet Type"], names())
    pg.fill("#shop-search","zzzz"); check("empty state shown", pg.get_by_text("Nothing matches those filters").is_visible())
    pg.get_by_role("button",name="Clear filters").first.click()
    check("clear restores 6", len(names())==6)
    pg.get_by_role("button",name="Typographic",exact=True).click(); check("style Typographic -> 2", sorted(names())==["Slow Living","The Quiet Type"], names())
    pg.get_by_role("button",name="Clear all filters").click()
    pg.get_by_role("button",name="Under ₹550").click(); check("price <550 -> 2", sorted(names())==["Everyday Essential","Grounded"], names())
    pg.get_by_role("button",name="Clear all filters").click()
    pg.get_by_role("button",name="Terracotta",exact=True).click(); check("colour Terracotta -> 3", sorted(names())==["Everyday Essential","Off Script","Unfiltered"], names())
    pg.get_by_role("button",name="XXL",exact=True).click(); check("colour+size combine", len(names())==3)
    pg.get_by_role("button",name="Clear all filters").click()
    pg.select_option("#shop-sort","price-asc"); check("sort price asc", names()[0]=="Everyday Essential" and names()[-1]=="Unfiltered", names())
    pg.select_option("#shop-sort","price-desc"); check("sort price desc", names()[0]=="Unfiltered", names())
    pg.select_option("#shop-sort","newest"); check("sort newest", names()[0]=="Unfiltered" and names()[1]=="Slow Living", names())

    # Quick view
    pg.get_by_role("button",name="Quick view Unfiltered").click()
    dlg=pg.locator("dialog"); check("quick view opens", dlg.is_visible())
    dlg.get_by_role("button",name="Add to cart").click(); check("size required error", dlg.get_by_text("Please choose a size.").is_visible())
    dlg.get_by_role("button",name="M",exact=True).click(); dlg.get_by_role("button",name="Add to cart").click()
    pg.wait_for_timeout(200); check("quick view add -> header count 1", pg.locator("header a[href='/cart']").inner_text().strip().endswith("1"), pg.locator("header a[href='/cart']").inner_text())
    pg.keyboard.press("Escape"); check("Escape closes quick view", not dlg.is_visible())

    # PDP
    pg.goto(B+"/shop/grounded"); check("PDP title", "Grounded" in pg.title(), pg.title())
    check("PDP has related products", pg.locator("#related-title").is_visible() and pg.locator("main section article").count()==3)
    pg.get_by_role("button",name="Charcoal").click(); check("colour label updates", pg.get_by_text("Charcoal",exact=True).first.is_visible())
    pg.get_by_role("button",name="Back view").click(); pg.get_by_role("button",name="Detail view").click()
    for _ in range(2): pg.get_by_role("button",name="Increase quantity").click()
    pg.get_by_role("button",name="L",exact=True).click(); pg.get_by_role("button",name="Add to cart").click()
    pg.wait_for_timeout(200)
    check("PDP add qty 3 -> count 4", pg.locator("header a[href='/cart']").inner_text().strip().endswith("4"), pg.locator("header a[href='/cart']").inner_text())
    pg.get_by_role("button",name="Add to cart").click(); pg.wait_for_timeout(200)
    cart=json.loads(pg.evaluate("localStorage.getItem('threadify-cart-v1')"))
    check("same line merges (3+3=6 on one line, 2 lines total)", len(cart)==2 and [i for i in cart if i['name']=='Grounded'][0]['quantity']==6, [(i['name'],i['size'],i['colorName'],i['quantity']) for i in cart])
    pg.reload(); pg.wait_for_timeout(300)
    check("cart persists after reload", pg.locator("header a[href='/cart']").inner_text().strip().endswith("7"), pg.locator("header a[href='/cart']").inner_text())
    bad.clear(); r=pg.goto(B+"/shop/not-a-product"); check("unknown slug -> 404", r.status==404, r.status)

    # Mobile overflow
    m=br.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True).new_page()
    for path in ["/","/shop","/shop/off-script"]:
        m.goto(B+path); m.wait_for_timeout(300)
        w=m.evaluate("[document.documentElement.scrollWidth, window.innerWidth]")
        check(f"no horizontal overflow {path}", w[0]<=w[1], w)
    m.goto(B+"/"); m.get_by_role("button",name="Open menu").click()
    check("mobile menu opens with links", m.locator("#mobile-menu a").count()>=5)
    m.get_by_role("link",name="Shop").last.click(); m.wait_for_url("**/shop"); check("mobile menu link navigates", m.url.endswith("/shop"))
    m.goto(B+"/"); m.get_by_role("link",name="SEE OUR COLLECTION").click(); m.wait_for_url("**/shop"); check("SEE OUR COLLECTION navigates (click)", m.url.endswith("/shop"))
    print("4xx/5xx responses seen on desktop context:", sorted(set(bad)))
    check("no JS page errors", not [e for e in errs if "Failed to load resource" not in e], errs[:3])
    br.close()
print(f"\n{sum(o for _,o in res)}/{len(res)} passed")
