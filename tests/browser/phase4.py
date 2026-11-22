from playwright.sync_api import sync_playwright
import json, base64
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))

with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(B+"/studio"); pg.wait_for_selector("svg[role=img]")
    price=lambda: pg.locator("dt:has-text('Per T-shirt') + dd").inner_text()
    body=lambda: pg.locator("svg[role=img] > path").first
    layer_boxes=lambda: pg.locator("g[data-layer-id] rect")

    check("empty state + no edit panel", pg.get_by_text("Nothing on the front yet").is_visible() and pg.get_by_role("heading",name="Edit text").count()==0)
    check("base price with no art = 549", "549" in price(), price())
    pg.get_by_role("button",name="Add to cart ·").click()
    check("add with no art -> error", pg.get_by_text("Add some artwork or text before adding to cart.").is_visible())

    # Colour & fit
    d0=body().get_attribute("d"); pg.get_by_role("button",name="Olive",exact=True).click()
    check("colour changes mockup fill", body().get_attribute("fill")=="#667052", body().get_attribute("fill"))
    pg.get_by_role("button",name="Oversized").click()
    check("fit changes mockup shape", body().get_attribute("d")!=d0)
    check("oversized fee shown", pg.get_by_text("Oversized fit",exact=True).is_visible() and "599" in price(), price())
    pg.get_by_role("button",name="Regular",exact=True).click()

    # Text
    pg.get_by_role("button",name="Add text").click()
    check("text layer added + edit panel", pg.get_by_role("heading",name="Edit text").is_visible() and pg.locator("svg[role=img] text").count()==1)
    pg.fill("#txt","Hello Indore"); check("text edit updates preview", pg.locator("svg[role=img] text").text_content()=="Hello Indore")
    ff0=pg.locator("svg[role=img] text").evaluate("e=>getComputedStyle(e).fontFamily")
    pg.select_option("#font","mono"); ff1=pg.locator("svg[role=img] text").evaluate("e=>getComputedStyle(e).fontFamily")
    check("font change applies", ff0!=ff1 and "Courier" in ff1, ff1)
    pg.locator("#fsize").fill("40"); check("text size applies", pg.locator("svg[role=img] text").get_attribute("font-size")=="40")
    pg.get_by_role("button",name="Text colour #B87958").click(); check("text colour applies", pg.locator("svg[role=img] text").get_attribute("fill").lower()=="#b87958")
    check("front-only price = 649", "649" in price(), price())

    # Mouse drag + clamp
    b=layer_boxes().first.bounding_box(); cx,cy=b["x"]+b["width"]/2,b["y"]+b["height"]/2
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.mouse.move(cx+40,cy-30,steps=8); pg.mouse.up()
    a=layer_boxes().first.bounding_box()
    check("mouse drag moves layer ~(+40,-30)", abs((a["x"]-b["x"])-40)<4 and abs((a["y"]-b["y"])+30)<4, (round(a["x"]-b["x"]),round(a["y"]-b["y"])))
    cx,cy=a["x"]+a["width"]/2,a["y"]+a["height"]/2
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.mouse.move(cx+600,cy+600,steps=10); pg.mouse.up()
    svgb=pg.locator("svg[role=img]").bounding_box(); k=svgb["width"]/400; far=layer_boxes().first.bounding_box()
    pa_right=svgb["x"]+270*k; pa_bottom=svgb["y"]+290*k
    check("drag clamped to print area", far["x"]+far["width"]/2<=pa_right+2 and far["y"]+far["height"]/2<=pa_bottom+2, (round(far["x"]+far["width"]/2),round(pa_right)))
    pg.get_by_role("button",name="Centre in print area").click()
    c=layer_boxes().first.bounding_box(); check("centre button re-centres", abs((c["x"]+c["width"]/2)-(svgb["x"]+200*k))<3)

    # Keyboard
    pg.locator("g[data-layer-id]").first.focus(); before=layer_boxes().first.bounding_box()["x"]
    pg.keyboard.press("ArrowRight"); pg.keyboard.press("Shift+ArrowRight")
    after=layer_boxes().first.bounding_box()["x"]; check("arrow keys nudge layer", after>before, round(after-before,1))
    pg.keyboard.press("Delete"); check("Delete key removes layer", layer_boxes().count()==0 and "549" in price(), price())

    # Uploads (generate PNG + JPEG inside the browser)
    mk=lambda mime: base64.b64decode(pg.evaluate("""async(m)=>{const c=document.createElement('canvas');c.width=1600;c.height=800;const x=c.getContext('2d');x.fillStyle='#c0392b';x.fillRect(0,0,1600,800);x.fillStyle='#fff';x.fillRect(100,100,600,300);
      const b=await new Promise(r=>c.toBlob(r,m,0.9));const buf=new Uint8Array(await b.arrayBuffer());let s='';buf.forEach(v=>s+=String.fromCharCode(v));return btoa(s)}""",mime))
    png=mk("image/png"); jpg=mk("image/jpeg")
    pg.set_input_files("#art-upload",{"name":"art.png","mimeType":"image/png","buffer":png}); pg.wait_for_selector("svg[role=img] image")
    img=pg.locator("svg[role=img] image"); href=img.get_attribute("href")
    check("PNG upload renders in print area", href.startswith("data:image/png"), href[:22])
    w0=float(img.get_attribute("width")); pg.locator("#iscale").fill("150"); w1=float(img.get_attribute("width"))
    check("image resize slider scales width x1.5", abs(w1/w0-1.5)<0.01, (w0,w1))
    pg.set_input_files("#art-upload",{"name":"photo.jpeg","mimeType":"image/jpeg","buffer":jpg}); pg.wait_for_timeout(400)
    check("JPEG upload accepted", pg.locator("svg[role=img] image").count()==2 and pg.locator("svg[role=img] image").nth(1).get_attribute("href").startswith("data:image/jpeg"))
    pg.set_input_files("#art-upload",{"name":"a.gif","mimeType":"image/gif","buffer":b"GIF89a"}); pg.wait_for_timeout(200)
    check("GIF rejected with message", pg.get_by_text("Please upload a PNG, JPG or JPEG image.").is_visible() and pg.locator("svg[role=img] image").count()==2)
    pg.set_input_files("#art-upload",{"name":"fake.png","mimeType":"image/png","buffer":b"not really an image"}); pg.wait_for_timeout(300)
    check("corrupt PNG rejected", pg.get_by_text("could not be read as an image").is_visible() and pg.locator("svg[role=img] image").count()==2)
    pg.set_input_files("#art-upload",{"name":"huge.png","mimeType":"image/png","buffer":b"0"*(5*1024*1024+10)}); pg.wait_for_timeout(200)
    check("oversize file rejected", pg.get_by_text("under 5 MB").is_visible())

    # Front/back
    pg.get_by_role("button",name="back (0)").click()
    check("back view starts empty, front art hidden", pg.locator("svg[role=img] image").count()==0 and pg.get_by_text("Nothing on the back yet").is_visible())
    check("svg labelled back", "back view" in pg.locator("svg[role=img]").get_attribute("aria-label"))
    pg.get_by_role("button",name="Add text").click(); pg.fill("#txt","BACK PRINT")
    check("tab counts front(2) back(1)", pg.get_by_role("button",name="front (2)").is_visible() and pg.get_by_role("button",name="back (1)").is_visible())
    check("both sides priced 749", "749" in price(), price())
    pg.get_by_role("button",name="front (2)").click(); check("front art returns", pg.locator("svg[role=img] image").count()==2)

    # Cart
    pg.get_by_role("button",name="Oversized").click(); check("both sides + oversized = 799", "799" in price(), price())
    pg.get_by_role("button",name="Add to cart ·").click(); check("size required error", pg.get_by_text("Please choose a size.").is_visible())
    pg.get_by_role("button",name="L",exact=True).first.click(); pg.get_by_role("button",name="Increase quantity").click()
    pg.get_by_role("button",name="Add to cart ·").click(); pg.wait_for_timeout(200)
    check("added message + header count 2", pg.get_by_text("added to the cart").is_visible() and pg.locator("header a[href='/cart']").inner_text().strip().endswith("2"))
    raw=pg.evaluate("localStorage.getItem('threadify-cart-v1')"); cart=json.loads(raw); it=cart[0]
    check("cart item stores price/qty/size/colour", it["unitPrice"]==799 and it["quantity"]==2 and it["size"]=="L" and it["colorName"]=="Olive" and it["productId"] is None, {k:it[k] for k in ("unitPrice","quantity","size","colorName")})
    cz=it["customization"]; check("customization preserved (fit, 3 layers, sides)", cz["fit"]=="Oversized" and len(cz["layers"])==3 and sorted(l["side"] for l in cz["layers"])==["back","front","front"])
    check("uploaded artwork preserved in cart", sum(1 for l in cz["layers"] if l.get("imageDataUrl","").startswith("data:image/"))==2 and len(raw)>2000, len(raw))
    pg.reload(); pg.wait_for_timeout(300); check("cart persists after reload", pg.locator("header a[href='/cart']").inner_text().strip().endswith("2"))
    check("reload clears studio draft (fresh canvas)", pg.get_by_text("Nothing on the front yet").is_visible())

    # Reset
    pg.get_by_role("button",name="Add text").click(); pg.get_by_role("button",name="Olive",exact=True).click(); pg.get_by_role("button",name="Reset design").click()
    check("reset clears layers, colour, price", layer_boxes().count()==0 and body().get_attribute("fill")=="#EDE6D6" and "549" in price())

    # Mobile
    mc=br.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True); m=mc.new_page(); m.goto(B+"/studio"); m.wait_for_selector("svg[role=img]")
    w=m.evaluate("[document.documentElement.scrollWidth, window.innerWidth]"); check("mobile: no horizontal overflow", w[0]<=w[1], w)
    m.get_by_role("button",name="Add text").click()
    m.evaluate("window.scrollTo(0, 900)"); m.wait_for_timeout(200)
    sb=m.locator("svg[role=img]").bounding_box(); check("mobile: preview stays visible while scrolled to controls", sb["y"]>=0 and sb["y"]+sb["height"]<=844 and sb["height"]>200, {k:round(v) for k,v in sb.items()})
    small=[bx for bx in (m.locator("main button:visible").evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]})")) if bx[1]<40 or bx[0]<40]
    check("mobile: touch targets >=40px", len(small)==0, small[:4])
    m.evaluate("window.scrollTo(0,0)"); m.wait_for_timeout(200)
    hb=m.locator("g[data-layer-id] rect").first.bounding_box(); x,y=hb["x"]+hb["width"]/2,hb["y"]+hb["height"]/2
    cdp=mc.new_cdp_session(m)
    cdp.send("Input.dispatchTouchEvent",{"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
    for i in range(1,9): cdp.send("Input.dispatchTouchEvent",{"type":"touchMove","touchPoints":[{"x":x-4*i,"y":y+3*i}]})
    cdp.send("Input.dispatchTouchEvent",{"type":"touchEnd","touchPoints":[]}); m.wait_for_timeout(150)
    ha=m.locator("g[data-layer-id] rect").first.bounding_box()
    check("mobile: touch drag moves layer and page does not scroll", ha["x"]<hb["x"]-20 and ha["y"]>hb["y"]+15 and m.evaluate("window.scrollY")==0, (round(ha["x"]-hb["x"]),round(ha["y"]-hb["y"]),m.evaluate("window.scrollY")))
    check("no JS page errors", not errs, errs[:3])
    br.close()
print(f"\n{sum(o for _,o in res)}/{len(res)} passed")
