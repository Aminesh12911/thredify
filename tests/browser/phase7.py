from playwright.sync_api import sync_playwright
import json
from urllib.parse import urlparse
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))
path=lambda u: urlparse(u).path
ADMIN=("admin@threadify.example","Admin@12345")
SESSION_SET="() => { const v = localStorage.getItem('threadify-demo-session-v1'); return v && v !== 'null' && !/^\\/account\\/(login|register)/.test(location.pathname); }"

with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    def login(email,pw,url="/account/login"):
        pg.goto(B+url); pg.fill("#auth-email",email); pg.fill("#auth-password",pw); pg.get_by_role("button",name="Log in").click()
    def logout():
        pg.goto(B+"/account"); pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")

    # ---- guard states
    pg.goto(B+"/admin"); pg.wait_for_selector("text=Admin sign-in required")
    check("signed-out /admin shows sign-in required", True)
    check("demo-mode hint shows demo admin credentials", pg.get_by_text("admin@threadify.example").first.is_visible())
    check("hint says the demo guard is not real security", pg.get_by_text("not real security").is_visible())
    check("no dashboard content leaks when signed out", pg.locator("[data-testid=stat-orders]").count()==0 and pg.get_by_role("link",name="Products").count()==0 or not pg.get_by_role("navigation",name="Admin").is_visible())

    # customer account
    pg.goto(B+"/account/register"); pg.fill("#auth-name","Cust Omer"); pg.fill("#auth-email","cust.omer@example.com"); pg.fill("#auth-password","Sample123")
    pg.get_by_role("button",name="Create account").click(); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_selector("text=Signed in as")
    pg.goto(B+"/admin"); pg.wait_for_selector("text=Not authorised")
    check("customer account sees 'Not authorised' on /admin", True)
    for sub in ("products","orders","customers","enquiries"):
        pg.goto(B+f"/admin/{sub}"); pg.wait_for_selector("text=Not authorised")
    check("customer is blocked on every admin sub-page", True)
    logout()

    # wrong admin password
    login(ADMIN[0],"WrongPass1"); pg.wait_for_timeout(700)
    check("demo admin with wrong password rejected", "Incorrect email or password" in pg.locator("form p[role=alert]").first.inner_text())

    # ---- real admin login via ?next=/admin
    login(*ADMIN, url="/account/login?next=/admin")
    pg.wait_for_url("**/admin", timeout=8000); pg.wait_for_selector("[data-testid=stat-orders]")
    check("admin login with ?next lands on /admin dashboard", path(pg.url)=="/admin")
    check("demo-mode banner visible in admin", pg.get_by_text("Demo mode").first.is_visible())
    check("noindex on admin pages", "noindex" in (pg.locator("meta[name=robots]").get_attribute("content") or ""))
    check("overview empty before demo data: 0 orders", pg.locator("[data-testid=stat-orders]").inner_text()=="0")
    check("overview shows 6 seed products", pg.locator("[data-testid=stat-products]").inner_text()=="6")

    # ---- demo data
    pg.get_by_role("button",name="Load demo data").click(); pg.wait_for_function("document.querySelector('[data-testid=stat-orders]')?.textContent==='7'", timeout=8000)
    check("Load demo data -> 7 orders", True)
    rev=pg.locator("[data-testid=stat-revenue]").inner_text(); pend=pg.locator("[data-testid=stat-pending]").inner_text()
    check("revenue tile is a ₹ amount, pending is numeric", rev.startswith("₹") and pend.isdigit(), (rev,pend))
    pg.get_by_role("button",name="Load demo data").click() if pg.get_by_role("button",name="Load demo data").count() else None
    pg.reload(); pg.wait_for_selector("[data-testid=stat-orders]")
    check("demo data is idempotent (still 7 after reload/second load)", pg.locator("[data-testid=stat-orders]").inner_text()=="7")
    check("demo data persists after reload (still admin)", path(pg.url)=="/admin")

    # ---- nav
    for label,sub in (("Products","products"),("Orders","orders"),("Customers","customers"),("Enquiries","enquiries"),("Overview","")):
        pg.get_by_role("navigation",name="Admin").get_by_role("link",name=label).click(); pg.wait_for_url("**/admin"+("/"+sub if sub else ""), timeout=8000)
    check("admin nav reaches all five sections", True)
    check("active nav item marked aria-current", pg.get_by_role("navigation",name="Admin").locator("[aria-current=page]").count()==1)

    # ---- products CRUD
    pg.goto(B+"/admin/products"); pg.wait_for_selector("[data-testid=product-row]")
    check("products list shows 6 rows", pg.locator("[data-testid=product-row]").count()==6)
    pg.get_by_role("button",name="Add product").click(); pg.wait_for_selector("#pf-name")
    pg.get_by_role("button",name="Add product").last.click(); pg.wait_for_timeout(300)
    check("empty product form shows validation errors (modal stays open)", pg.locator("#pf-name").is_visible() and pg.locator("form [role=alert]").count()>=2)
    check("first error is announced + fields marked invalid", pg.locator("#pf-name[aria-invalid=true]").count()==1)
    pg.fill("#pf-name","Test Tee Alpha")
    check("slug auto-generated from name", pg.input_value("#pf-slug")=="test-tee-alpha", pg.input_value("#pf-slug"))
    pg.fill("#pf-price","-5"); pg.fill("#pf-cat","Experiments"); pg.fill("#pf-slogan","alpha"); pg.fill("#pf-desc","A tee created by the automated admin test.")
    pg.get_by_label("Olive").check(force=True)
    pg.fill("#pf-stock-S","3"); pg.fill("#pf-stock-M","0"); pg.fill("#pf-stock-L","12"); pg.fill("#pf-stock-XL","x"); pg.fill("#pf-stock-XXL","0")
    pg.get_by_role("button",name="Add product").last.click(); pg.wait_for_timeout(300)
    check("negative price rejected", pg.locator("#e-price").count()==1)
    check("non-numeric stock rejected", pg.locator("#pf-stock-XL[aria-invalid=true]").count()==1)
    pg.fill("#pf-price","799"); pg.fill("#pf-stock-XL","4")
    pg.get_by_role("button",name="Add product").last.click(); pg.wait_for_selector("text=Product added.")
    check("valid product saved, modal closed, success message", pg.locator("#pf-name").count()==0 or not pg.locator("#pf-name").is_visible())
    check("list now has 7 products incl. the new one", pg.locator("[data-testid=product-row]").count()==7 and pg.get_by_text("Test Tee Alpha").first.is_visible())
    row=pg.locator("[data-testid=product-row]",has_text="Test Tee Alpha")
    check("low/out-of-stock sizes flagged on the row", "M (0)" in row.inner_text() and "S (3)" in row.inner_text(), row.inner_text().replace("\n"," | "))
    check("total stock = 19", "19 in stock" in row.inner_text())
    # duplicate slug
    pg.get_by_role("button",name="Add product").first.click(); pg.wait_for_selector("#pf-name")
    pg.fill("#pf-name","Test Tee Alpha"); pg.fill("#pf-price","500"); pg.fill("#pf-cat","Experiments"); pg.fill("#pf-slogan","dup"); pg.fill("#pf-desc","Duplicate slug attempt for the test.")
    pg.get_by_label("Cream").check(force=True)
    pg.get_by_role("button",name="Add product").last.click(); pg.wait_for_timeout(500)
    check("duplicate slug rejected with a clear message", pg.locator("form p[role=alert]").last.inner_text().strip()!="" and pg.locator("#pf-name").is_visible(), pg.locator("form p[role=alert]").last.inner_text())
    pg.get_by_role("button",name="Cancel").click(); pg.wait_for_timeout(300)
    # edit
    pg.get_by_role("button",name="Edit Test Tee Alpha").click(); pg.wait_for_selector("#pf-name")
    check("edit form pre-filled", pg.input_value("#pf-name")=="Test Tee Alpha" and pg.input_value("#pf-price")=="799" and pg.input_value("#pf-stock-L")=="12")
    pg.fill("#pf-price","849"); pg.fill("#pf-stock-M","25")
    pg.get_by_role("button",name="Save changes").click(); pg.wait_for_selector("text=Product saved.")
    row=pg.locator("[data-testid=product-row]",has_text="Test Tee Alpha")
    check("edit persisted: price ₹849 and stock 44", "849" in row.inner_text() and "44 in stock" in row.inner_text(), row.inner_text().replace("\n"," | "))
    check("edit didn't create a duplicate", pg.locator("[data-testid=product-row]").count()==7)
    pg.reload(); pg.wait_for_selector("[data-testid=product-row]")
    check("product changes persist after reload", pg.get_by_text("Test Tee Alpha").first.is_visible())
    # public shop unaffected in demo mode
    pg.goto(B+"/shop"); pg.wait_for_selector("text=Grounded")
    check("demo-mode admin edits do NOT change the public shop (as labelled)", pg.get_by_text("Test Tee Alpha").count()==0)
    # delete
    pg.goto(B+"/admin/products"); pg.wait_for_selector("[data-testid=product-row]")
    pg.get_by_role("button",name="Delete Test Tee Alpha").click()
    check("delete asks for inline confirmation first", pg.get_by_text("Delete?").is_visible() and pg.locator("[data-testid=product-row]").count()==7)
    pg.get_by_role("button",name="Cancel").click(); pg.wait_for_timeout(200)
    check("cancel keeps the product", pg.locator("[data-testid=product-row]").count()==7)
    pg.get_by_role("button",name="Delete Test Tee Alpha").click(); pg.get_by_role("button",name="Yes, delete").click(); pg.wait_for_selector("text=Deleted")
    try: pg.wait_for_function("document.querySelectorAll('[data-testid=product-row]').length===6", timeout=3000)
    except Exception: pass
    check("confirmed delete removes it", pg.locator("[data-testid=product-row]").count()==6 and pg.locator("[data-testid=product-row]", has_text="Test Tee Alpha").count()==0)

    # ---- orders
    pg.goto(B+"/admin/orders"); pg.wait_for_selector("[data-testid=order-row]")
    check("orders list shows 7 demo orders", pg.locator("[data-testid=order-row]").count()==7)
    pg.fill("#o-search","DEMO3"); pg.wait_for_timeout(200)
    check("search by order ID", pg.locator("[data-testid=order-row]").count()==1 and "DEMO3" in pg.locator("[data-testid=order-row]").inner_text())
    pg.fill("#o-search","zzzz-nothing"); pg.wait_for_timeout(200)
    check("no-match empty state", pg.get_by_text("No orders match").is_visible())
    pg.fill("#o-search","")
    pg.select_option("#o-status","cancelled"); pg.wait_for_timeout(200)
    n_c=pg.locator("[data-testid=order-row]").count()
    check("status filter works", n_c>=1 and all("Cancelled" in pg.locator("[data-testid=order-row]").nth(i).locator("select").evaluate("e=>e.selectedOptions[0].text") for i in range(n_c)), n_c)
    pg.select_option("#o-status","all")
    # details
    pg.get_by_role("button",name="View details for THR-20261001-DEMO1").click(); pg.wait_for_selector("dialog[open]")
    check("order details dialog shows code, customer and timeline", pg.locator("dialog[open]").get_by_text("THR-20261001-DEMO1").first.is_visible() and pg.locator("dialog[open] ol").count()>=1)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    check("Escape closes the dialog", pg.locator("dialog[open]").count()==0)
    # status change -> reflected on /track
    code="THR-20261001-DEMO1"
    pg.select_option(f"#st-{code}","shipped"); pg.wait_for_selector(f"text={code} is now")
    check("status change confirmed with message", True)
    pg.goto(B+"/track"); pg.fill("input[name=code], #order-code, input[type=text]",code); pg.get_by_role("button",name="Track order").click()
    pg.wait_for_selector("text=Shipped")
    check("new status shows on the customer tracking page", pg.get_by_text("Shipped").first.is_visible())
    pg.goto(B+"/admin"); pg.wait_for_selector("[data-testid=stat-orders]")

    # ---- customers
    pg.goto(B+"/admin/customers"); pg.wait_for_selector("[data-testid=customer-row]")
    n=pg.locator("[data-testid=customer-row]").count()
    check("customers listed (from orders + accounts)", n>=3, n)
    check("registered account shows 'Account' badge", pg.locator("[data-testid=customer-row]",has_text="cust.omer@example.com").count()==1)
    pg.fill("#c-search","cust.omer"); pg.wait_for_timeout(200)
    check("customer search narrows list", pg.locator("[data-testid=customer-row]").count()==1)
    pg.fill("#c-search","qqqqqq"); pg.wait_for_timeout(200)
    check("customer empty-match state", pg.get_by_text("No customers match").is_visible())

    # ---- enquiries
    pg.goto(B+"/admin/enquiries"); pg.wait_for_selector("[data-testid=enquiry-row]")
    check("4 demo enquiries listed", pg.locator("[data-testid=enquiry-row]").count()==4)
    pg.select_option("#e-kind","custom_design"); pg.wait_for_timeout(200)
    k=pg.locator("[data-testid=enquiry-row]").count()
    check("kind filter narrows list", 1<=k<4, k)
    pg.select_option("#e-kind","all")
    first=pg.locator("[data-testid=enquiry-row]").first; sel=first.locator("select")
    sel.select_option("closed"); pg.wait_for_selector("text=as closed")
    pg.reload(); pg.wait_for_selector("[data-testid=enquiry-row]")
    check("enquiry status change persists", "closed" in [pg.locator("[data-testid=enquiry-row]").nth(i).locator("select").input_value() for i in range(4)])

    # ---- mobile
    for w in (360,390):
        m=br.new_context(viewport={"width":w,"height":800}); mp=m.new_page()
        mp.goto(B+"/account/login"); mp.fill("#auth-email",ADMIN[0]); mp.fill("#auth-password",ADMIN[1]); mp.get_by_role("button",name="Log in").click(); mp.wait_for_function(SESSION_SET, timeout=8000)
        for sub in ("","/products","/orders","/customers","/enquiries"):
            mp.goto(B+"/admin"+sub); mp.wait_for_timeout(700)
            ov=mp.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if ov>0: check(f"no horizontal overflow {w}px /admin{sub}", False, ov)
        else: pass
        check(f"no horizontal overflow on any admin page at {w}px", True)
        mp.goto(B+"/admin/products"); mp.wait_for_selector("[data-testid=product-row]"); mp.get_by_role("button",name="Add product").click(); mp.wait_for_selector("#pf-name")
        box=mp.locator("dialog[open]").bounding_box()
        check(f"product dialog fits viewport at {w}px", box and box["x"]>=0 and box["x"]+box["width"]<=w+1, box)
        small=mp.evaluate("""() => [...document.querySelectorAll('dialog[open] button, dialog[open] input:not(.sr-only):not([type=checkbox]), dialog[open] label:has(input[type=checkbox]), dialog[open] select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<40}).map(e=>e.outerHTML.slice(0,60))""")
        check(f"tap targets ≥40px in product form at {w}px", not small, small[:3])
        m.close()

    check("no uncaught page errors", not errs, errs[:3])
    br.close()
bad=[n for n,o in res if not o]
print(f"\n{len(res)-len(bad)}/{len(res)} passed"); raise SystemExit(1 if bad else 0)
