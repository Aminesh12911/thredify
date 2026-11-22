from playwright.sync_api import sync_playwright
import json, re
import os
B=os.environ.get("BASE_URL","http://localhost:3100")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail else ""))

PW="Sample123"
from urllib.parse import urlparse
path=lambda u: urlparse(u).path
SESSION_SET="() => { const v = localStorage.getItem('threadify-demo-session-v1'); return v && v !== 'null' && !/^\\/account\\/(login|register)/.test(location.pathname); }"
with sync_playwright() as p:
    br=p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--no-sandbox"])
    ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    acct=lambda: pg.locator("header a[href='/account']").inner_text().strip()
    def register(name,email,pw=PW):
        pg.goto(B+"/account/register"); pg.fill("#auth-name",name); pg.fill("#auth-email",email); pg.fill("#auth-password",pw)
        pg.get_by_role("button",name="Create account").click()
    def login(email,pw=PW,url="/account/login"):
        pg.goto(B+url); pg.fill("#auth-email",email); pg.fill("#auth-password",pw); pg.get_by_role("button",name="Log in").click()
    err=lambda: pg.locator("form p[role=alert]").first.inner_text()

    pg.goto(B+"/account"); pg.wait_for_selector("text=You're not signed in"); check("logged-out /account shows sign-in prompt", True)
    check("header says Account when signed out", acct()=="Account", acct())

    # registration validation
    pg.goto(B+"/account/register"); check("demo-mode notice on form", pg.get_by_text("Demo mode:").is_visible())
    cases=[("","a@example.com",PW,"full name"),("Asha Rao","not-an-email",PW,"valid email"),("Asha Rao","a@example.com","short1","at least 8"),("Asha Rao","a@example.com","onlyletters","letter and one number"),("Asha Rao","a@example.com","12345678","letter and one number")]
    for n,e,pw,frag in cases:
        register(n,e,pw); pg.wait_for_timeout(500)
        check(f"register rejects ({frag})", frag in err() and "/register" in pg.url, err())
    register("Asha Rao","asha.test@example.com"); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_selector("text=Signed in as")
    check("register succeeds -> /account, signed in", pg.get_by_text("asha.test@example.com").first.is_visible())
    check("header shows first name", acct()=="Asha", acct())

    # password storage
    raw=pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(localStorage)))")
    users=json.loads(pg.evaluate("localStorage.getItem('threadify-demo-users-v1')")); u=users["asha.test@example.com"]
    check("password not stored in plain text anywhere", PW not in raw and "password" not in json.dumps(u).lower())
    check("stored salted PBKDF2 hash (210k iterations)", u["iterations"]==210000 and len(u["salt"])>=20 and len(u["hash"])>=40, {k:(v if k=="iterations" else len(str(v))) for k,v in u.items() if k in("iterations","salt","hash")})
    pg.goto(B+"/account/register"); pg.wait_for_url("**/account", timeout=5000); check("signed-in user is bounced from register to exactly /account", path(pg.url)=="/account", pg.url)
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    register("Other Person","asha.test@example.com"); pg.wait_for_timeout(700)
    check("duplicate email rejected", "already exists" in err(), err())
    login("asha.test@example.com",PW); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_selector("text=Signed in as")

    # session persistence + logout
    pg.reload(); pg.wait_for_selector("text=Signed in as"); check("session survives reload", acct()=="Asha")
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    check("logout -> signed out, header resets", acct()=="Account" and pg.evaluate("localStorage.getItem('threadify-demo-session-v1')") in ("null",None))

    # login
    login("asha.test@example.com","WrongPass1"); pg.wait_for_timeout(700); e1=err()
    login("nobody@example.com","WrongPass1"); pg.wait_for_timeout(700); e2=err()
    check("wrong password: generic error", e1=="Incorrect email or password.", e1)
    check("unknown email: identical error (no enumeration)", e2==e1, e2)
    login("  ASHA.Test@Example.com ",PW); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_selector("text=Signed in as"); check("login works (email case/space-insensitive)", acct()=="Asha")
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")

    # open redirect
    login("asha.test@example.com",PW,"/account/login?next=//evil.example/x"); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_timeout(300)
    check("?next=//evil.example ignored (lands on exactly /account)", path(pg.url)=="/account" and "evil" not in pg.url, pg.url)
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    login("asha.test@example.com",PW,"/account/login?next=https://evil.example"); pg.wait_for_function(SESSION_SET, timeout=8000); check("?next=https://evil ignored (lands on exactly /account)", path(pg.url)=="/account", pg.url)
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    login("asha.test@example.com",PW,"/account/login?next=/cart"); pg.wait_for_function(SESSION_SET, timeout=8000); check("safe ?next=/cart honoured (lands on exactly /cart)", path(pg.url)=="/cart", pg.url)

    # profile
    pg.goto(B+"/account"); pg.wait_for_selector("#p-name")
    pg.fill("#p-phone","12345"); pg.get_by_role("button",name="Save profile").click(); check("bad phone rejected", pg.get_by_text("10-digit Indian mobile").is_visible())
    pg.fill("#p-name","Asha R. Rao"); pg.fill("#p-phone","98765 43210"); pg.get_by_role("button",name="Save profile").click(); pg.wait_for_selector("text=Profile saved.")
    check("profile saved, header updates", acct()=="Asha")
    pg.reload(); pg.wait_for_selector("#p-name"); check("profile persists", pg.input_value("#p-name")=="Asha R. Rao" and "98765" in pg.input_value("#p-phone"))
    check("email field read-only", pg.locator("#p-email").get_attribute("readonly") is not None)

    # addresses
    pg.get_by_role("button",name="Add an address").click(); pg.get_by_role("button",name="Save address").click()
    check("empty address rejected", pg.locator("form p[role=alert]").last.inner_text()!="")
    def addaddr(line,city,state,pin):
        if not pg.locator("#a-line1").is_visible(): pg.get_by_role("button",name="Add an address").click()
        pg.fill("#a-line1",line); pg.fill("#a-city",city); pg.select_option("#a-state",state); pg.fill("#a-pin",pin); pg.get_by_role("button",name="Save address").click(); pg.wait_for_timeout(250)
    addaddr("12 Sample Street, Demo Nagar","Indore","Madhya Pradesh","12345"); check("bad PIN rejected", pg.locator("#a-line1").is_visible() and "PIN" in pg.locator("form p[role=alert]").last.inner_text())
    pg.fill("#a-pin","452001"); pg.get_by_role("button",name="Save address").click(); pg.wait_for_timeout(250)
    items=lambda: pg.locator("ul[aria-label='Saved addresses'] > li")
    check("first address saved as default", items().count()==1 and "Default" in items().first.inner_text())
    addaddr("7 Test Road","Pune","Maharashtra","411001"); check("second address not default", items().count()==2 and "Default" not in items().nth(1).inner_text())
    items().nth(1).get_by_role("button",name="Make default").click(); pg.wait_for_timeout(250)
    check("make default moves the badge", "Default" in items().nth(1).inner_text() and "Default" not in items().first.inner_text())
    items().nth(1).get_by_role("button",name=re.compile("Delete address")).click(); pg.wait_for_timeout(250)
    check("deleting default promotes the remaining one", items().count()==1 and "Default" in items().first.inner_text())
    for i in range(4): addaddr(f"{i+20} Extra Lane","Indore","Madhya Pradesh","452002")
    check("limit of 5 addresses enforced", items().count()==5 and pg.get_by_role("button",name="Add an address").count()==0, items().count())
    items().nth(4).get_by_role("button",name=re.compile("Delete address")).click(); pg.wait_for_timeout(200)

    # orders: empty history -> checkout prefill -> order -> history
    check("order history empty state", pg.get_by_text("No orders yet.").is_visible())
    pg.goto(B+"/shop/grounded"); pg.get_by_role("button",name="M",exact=True).click(); pg.get_by_role("button",name="Add to cart").click()
    pg.goto(B+"/checkout"); pg.wait_for_selector("#name")
    check("signed-in checkout offers saved details (no guest notice)", pg.get_by_role("button",name="Use my saved details").is_visible() and pg.get_by_text("Checking out as a guest").count()==0)
    pg.get_by_role("button",name="Use my saved details").click()
    check("saved details prefill form", pg.input_value("#name")=="Asha R. Rao" and pg.input_value("#email")=="asha.test@example.com" and pg.input_value("#pin")=="452001" and pg.input_value("#state")=="Madhya Pradesh", [pg.input_value(x) for x in ("#name","#email","#pin")])
    pg.get_by_role("button",name=re.compile("^Pay ")).click(); pg.wait_for_url("**/order/THR-*", timeout=8000); code=pg.url.split("/")[-1]
    pg.goto(B+"/account"); pg.wait_for_selector("ul[aria-label='Order history']")
    check("order appears in account history", pg.locator("ul[aria-label='Order history']").inner_text().count(code)==1 and "₹" in pg.locator("ul[aria-label='Order history']").inner_text())
    pg.locator("ul[aria-label='Order history'] a").first.click(); pg.wait_for_selector("[data-testid=order-code]"); check("history link opens the order", pg.get_by_test_id("order-code").inner_text()==code)

    # second user is isolated
    pg.goto(B+"/account"); pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    register("Ben Kumar","ben.test@example.com"); pg.wait_for_function(SESSION_SET, timeout=8000); pg.wait_for_selector("text=No saved addresses yet.")
    check("other user sees no orders", pg.get_by_text("No orders yet.").is_visible())
    check("other user sees no addresses", pg.get_by_text("No saved addresses yet.").is_visible())
    pg.get_by_role("button",name="Log out").click(); pg.wait_for_selector("text=You're not signed in")
    pg.goto(B+"/shop/grounded"); pg.get_by_role("button",name="M",exact=True).click(); pg.get_by_role("button",name="Add to cart").click(); pg.goto(B+"/checkout"); pg.wait_for_selector("#name")
    check("guest checkout shows login hint", pg.get_by_text("Checking out as a guest").is_visible() and pg.get_by_role("button",name="Use my saved details").count()==0)

    # API in demo mode
    r=pg.request.post(B+"/api/orders",data={"x":1}); check("POST /api/orders -> 503 in demo mode", r.status==503, r.status)
    r=pg.request.get(B+"/api/orders/THR-20261120-ABCDE"); check("GET /api/orders/[code] -> 503 in demo mode", r.status==503, r.status)

    # mobile
    mc=br.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True); m=mc.new_page()
    for path in ("/account","/account/login","/account/register"):
        m.goto(B+path); m.wait_for_selector("main h1"); m.wait_for_timeout(300)
        w=m.evaluate("[document.documentElement.scrollWidth, window.innerWidth]"); check(f"mobile no overflow {path}", w[0]<=w[1], w)
    m.goto(B+"/account/login")
    small=m.locator("main button:visible, main input:visible, main a:visible").evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return [e.id||e.textContent.trim().slice(0,14),Math.round(r.height)]}).filter(a=>a[1]<40)")
    check("mobile login controls >=40px", len(small)==0, small)
    check("no JS page errors", not errs, errs[:3])
    br.close()
print(f"\n{sum(o for _,o in res)}/{len(res)} passed")
