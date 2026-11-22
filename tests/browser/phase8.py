from playwright.sync_api import sync_playwright
import json, re, urllib.request
from urllib.parse import urlparse, urljoin
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))

PAGES=["/","/shop","/shop/grounded","/studio","/cart","/checkout","/track","/about","/contact","/policies","/policies/privacy","/policies/terms","/policies/refunds","/policies/shipping","/policies/contact-information","/account/login","/account/register","/account"]
PUBLIC=[p for p in PAGES if p not in ("/cart","/checkout","/account","/account/login","/account/register")]
def get(path):
    try:
        r=urllib.request.urlopen(B+path); return r.status, r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8","replace")

with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)

    # ---- every page: status, title, description, one h1, lang
    titles={}
    for path in PAGES:
        r=pg.goto(B+path); pg.wait_for_timeout(400)
        t=pg.title(); d=pg.locator("meta[name=description]").get_attribute("content") if pg.locator("meta[name=description]").count() else ""
        h1=pg.locator("h1").count()
        titles[path]=t
        check(f"{path}: 200, title, description, exactly one h1", r.status==200 and t and d and h1==1, f"{r.status} | {t} | desc={bool(d)} | h1={h1}")
    check("page titles are unique", len(set(titles.values()))==len(titles), [t for t in titles.values() if list(titles.values()).count(t)>1])
    check("html lang=en", pg.locator("html").get_attribute("lang")=="en")

    # ---- no dead internal links (crawl nav+footer+page links from public pages)
    seen=set(); bad=[]
    for path in PUBLIC:
        pg.goto(B+path)
        for h in pg.eval_on_selector_all("a[href]","els=>els.map(e=>e.getAttribute('href'))"):
            if h.startswith(("mailto:","tel:","#","http")): continue
            u=urlparse(urljoin(B+path,h)); key=u.path
            if key in seen: continue
            seen.add(key)
            s,_=get(key)
            if s>=400: bad.append((path,key,s))
    check(f"no dead internal links ({len(seen)} unique targets checked)", not bad, bad)

    # ---- 404 page
    r=pg.goto(B+"/this-page-does-not-exist"); check("unknown URL -> 404 page with way home", r.status==404 and pg.get_by_role("link",name="Back to home").is_visible())
    r=pg.goto(B+"/policies/nonsense"); check("unknown policy -> 404", r.status==404)
    r=pg.goto(B+"/shop/nonsense"); check("unknown product -> 404", r.status==404)

    # ---- policies
    for slug in ("privacy","terms","refunds","shipping","contact-information"):
        pg.goto(B+f"/policies/{slug}")
        note=pg.locator("[role=note]").inner_text()
        check(f"/policies/{slug} labelled draft/sample", "Draft" in note and "reviewed" in note)
    pg.goto(B+"/policies/contact-information"); check("contact-information page shows sample placeholder details", pg.get_by_text("hello@threadify.example").first.is_visible() and pg.get_by_text("not a registered business").first.is_visible())
    pg.goto(B+"/policies/privacy"); txt=pg.locator("main").inner_text().lower()
    check("privacy policy states no card/CVV is collected", "card numbers" in txt and "cvv" in txt)
    pg.goto(B+"/policies"); check("policies index lists all 5", pg.locator("main ul li a").count()==5)
    pg.goto(B+"/"); pg.wait_for_load_state("networkidle"); foot=[a.strip() for a in pg.locator("footer a").all_inner_texts()]
    check("footer links to all 5 policies + about + contact", all(x in foot for x in ["Privacy Policy","Terms & Conditions","Refund & Cancellation","Shipping Policy","Contact Information","About"]) , foot)

    # ---- about
    pg.goto(B+"/about"); t=pg.locator("main").text_content()
    check("about has story, mission, vision, values, why-choose sections", all(x in t for x in ["Our story","Mission","Vision","Brand values","Why choose THREADIFY"]))
    check("about labels itself as a demo", "Demo store" in t)

    # ---- contact form
    pg.goto(B+"/contact"); pg.wait_for_selector("form[aria-label='Contact form']")
    check("contact page shows support details and sample label", pg.get_by_text("Sample details").first.is_visible() and pg.get_by_role("link",name="hello@threadify.example").first.is_visible())
    pg.get_by_role("button",name="Send message").click(); pg.wait_for_timeout(300)
    errs_shown=pg.locator("form p[role=alert]:not(:empty)").count()
    check("empty form shows field errors, focus moves to first invalid field", errs_shown>=2 and pg.evaluate("document.activeElement.id")=="c-name", errs_shown)
    check("invalid fields flagged aria-invalid", pg.locator("#c-name[aria-invalid=true]").count()==1 and pg.locator("#c-email[aria-invalid=true]").count()==1)
    pg.fill("#c-name","Asha Rao"); pg.fill("#c-email","bad-email"); pg.fill("#c-message","short")
    pg.get_by_role("button",name="Send message").click(); pg.wait_for_timeout(300)
    check("bad email and short message both rejected", "valid email" in pg.locator("#c-email-err").inner_text() and "10 characters" in pg.locator("#c-message-err").inner_text())
    pg.fill("#c-email","asha@example.com"); pg.fill("#c-subject","Bulk order question"); pg.fill("#c-message","Do you print for college fests in batches of 50?")
    check("character counter shown", "/1000" in pg.locator("form").inner_text())
    pg.get_by_role("button",name="Send message").click(); pg.wait_for_selector("[data-testid=contact-success]")
    check("valid message accepted, success state, demo wording honest", "no email is sent" in pg.locator("[data-testid=contact-success]").inner_text())
    stored=json.loads(pg.evaluate("localStorage.getItem('threadify-demo-enquiries-v1')"))
    check("enquiry stored (demo store) with kind + status new", stored[0]["status"]=="new" and stored[0]["kind"]=="contact" and stored[0]["email"]=="asha@example.com")
    pg.get_by_role("button",name="Send another message").click(); check("'Send another' resets the form", pg.input_value("#c-name")=="")
    pg.goto(B+"/contact?topic=custom"); check("?topic=custom preselects custom design request", pg.input_value("#c-kind")=="custom_design")
    # shows up in admin
    pg.goto(B+"/account/login"); pg.fill("#auth-email","admin@threadify.example"); pg.fill("#auth-password","Admin@12345"); pg.get_by_role("button",name="Log in").click(); pg.wait_for_timeout(1500)
    pg.goto(B+"/admin/enquiries"); pg.wait_for_selector("[data-testid=enquiry-row]")
    check("contact-form message appears in admin Enquiries", pg.locator("[data-testid=enquiry-row]",has_text="Bulk order question").count()==1)
    pg.goto(B+"/account"); pg.get_by_role("button",name="Log out").click(); pg.wait_for_timeout(500)

    # ---- FAQ
    pg.goto(B+"/contact"); n=pg.locator("details").count()
    check("FAQ has 8 questions, collapsed by default", n==8 and pg.locator("details[open]").count()==0)
    s=pg.locator("details summary").first; s.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    check("FAQ opens with keyboard (Enter)", pg.locator("details[open]").count()==1)
    check("FAQ summaries are ≥44px tall", all(pg.locator("details summary").nth(i).bounding_box()["height"]>=44 for i in range(n)))

    # ---- SEO files
    s,body=get("/robots.txt"); check("robots.txt blocks admin/api/cart/checkout/order/account and lists sitemap", s==200 and all(x in body for x in ["Disallow: /admin","Disallow: /api/","Disallow: /checkout","Disallow: /order/","Sitemap:"]), body.replace("\n"," | ")[:200])
    s,sm=get("/sitemap.xml"); locs=re.findall(r"<loc>(.*?)</loc>",sm)
    check("sitemap lists policies, about, contact, products", s==200 and any("/policies/privacy" in l for l in locs) and any("/about" in l for l in locs) and any("/shop/grounded" in l for l in locs), len(locs))
    check("sitemap excludes admin, cart, checkout, order, account", not any(x in l for l in locs for x in ("/admin","/cart","/checkout","/order/","/account")))
    s,og=get("/opengraph-image"); check("Open Graph image route works", s==200)
    for path in ("/","/shop/grounded"):
        _,html=get(path)
        check(f"{path}: og:title, og:description, canonical/OG url present", 'property="og:title"' in html and 'property="og:description"' in html and ('rel="canonical"' in html or path=="/"))
    _,html=get("/shop/grounded"); ld=[json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>',html)]
    prod=[x for x in ld if x.get("@type")=="Product"]
    check("product page has valid Product JSON-LD (INR price, availability)", prod and prod[0]["offers"]["priceCurrency"]=="INR" and prod[0]["offers"]["price"]>0 and "schema.org" in prod[0]["offers"]["availability"], prod[0]["offers"] if prod else ld)
    check("Organization JSON-LD on site pages", any(x.get("@type")=="Organization" for x in ld))
    for path in ("/cart","/checkout","/account","/admin","/order/THR-X"):
        _,h=get(path); check(f"{path} is noindex", "noindex" in h)

    # ---- security headers
    hr=urllib.request.urlopen(B+"/"); H={k.lower():v for k,v in hr.getheaders()}
    check("security headers set (nosniff, frame deny, referrer, permissions-policy)", H.get("x-content-type-options")=="nosniff" and H.get("x-frame-options")=="DENY" and "referrer-policy" in H and "camera=()" in H.get("permissions-policy",""), {k:v for k,v in H.items() if k in("x-content-type-options","x-frame-options")})
    check("X-Powered-By header removed", "x-powered-by" not in H)

    # ---- images: alt + lazy
    pg.goto(B+"/shop"); pg.wait_for_selector("a[href^='/shop/']")
    noalt=pg.evaluate("[...document.images].filter(i=>!i.hasAttribute('alt')).length")
    check("every <img> on /shop has an alt attribute", noalt==0, noalt)
    pg.goto(B+"/"); below=pg.evaluate("[...document.images].filter(i=>i.getBoundingClientRect().top>window.innerHeight*1.5 && i.loading!=='lazy').length")
    check("below-the-fold images are lazy-loaded", below==0, below)

    # ---- keyboard: skip link / focus order / focus visible
    pg.goto(B+"/"); pg.keyboard.press("Tab"); first=pg.evaluate("document.activeElement.textContent.trim().slice(0,30)")
    check("first Tab stop is a skip link or header control (keyboard reachable)", bool(first), first)
    vis=pg.evaluate("""()=>{const e=document.activeElement;const s=getComputedStyle(e);return s.outlineStyle!=='none'||s.boxShadow!=='none'}""")
    check("focus indicator visible on first focus", vis)
    pg.goto(B+"/policies/privacy"); check("policy page has a <main> landmark and breadcrumb nav", pg.locator("main").count()==1 and pg.get_by_role("navigation",name="Breadcrumb").count()==1)

    # ---- responsive: overflow + tap targets on every public page at 4 widths
    for w,h in ((360,740),(390,844),(768,1024),(1280,800)):
        m=br.new_context(viewport={"width":w,"height":h}); mp=m.new_page(); bad=[]; small=[]
        for path in PAGES:
            mp.goto(B+path); mp.wait_for_timeout(350)
            ov=mp.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            if ov>0: bad.append((path,ov))
            if w<=768:
                sm_=mp.evaluate("""()=>[...document.querySelectorAll('a,button,select,input:not([type=hidden]):not(.sr-only),summary')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);if(r.width===0||r.height===0||cs.visibility==='hidden')return false;if(e.closest('label') && e.type==='checkbox')return false;if(e.matches('input[type=radio],input[type=checkbox]'))return false;if(e.tagName==='A'&&e.closest('p,li')&&e.parentElement.childNodes.length>1&&e.closest('p'))return false;return r.height<36}).map(e=>(e.textContent||e.name||e.id||'').trim().slice(0,25)+'|'+e.tagName)""")
                for x in sm_: small.append((path,x))
        check(f"no horizontal overflow on any page at {w}px", not bad, bad)
        if w<=768: check(f"no controls under 36px tall at {w}px", not small, small[:6])
        m.close()

    check("no console/page errors across the run", not [e for e in errs if "404" not in e and "Failed to load resource" not in e], [e for e in errs if "404" not in e][:3])
    br.close()
bad=[n for n,o in res if not o]
print(f"\n{len(res)-len(bad)}/{len(res)} passed"); raise SystemExit(1 if bad else 0)
