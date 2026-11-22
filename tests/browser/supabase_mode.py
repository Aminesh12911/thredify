import json, re, urllib.request, urllib.error
import os
B=os.environ.get("BASE_URL","http://localhost:3200")
LOG=os.environ.get("SERVER_LOG")
res=[]
def check(name, ok, detail=""):
    res.append((name, bool(ok))); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail)[:150] if detail else ""))
def call(method, path, body=None, raw=None, headers=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req=urllib.request.Request(B+path, data=data, method=method, headers={"Content-Type":"application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return r.status, r.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.read().decode()
cust={"name":"Test Customer","email":"t@example.com","phone":"9876543210","line1":"12 Sample Street","city":"Indore","state":"Madhya Pradesh","pin":"452001"}
good={"items":[{"productId":"x","size":"M","colorName":"Olive","quantity":1}],"customer":cust,"method":"UPI","scenario":"success"}
j=lambda t: json.loads(t)

s,t=call("POST","/api/orders",raw=b"{not json"); check("invalid JSON -> 400", s==400, (s,t))
s,t=call("POST","/api/orders",{**good,"items":[]}); check("empty cart -> 400 with message", s==400 and "empty" in j(t)["error"].lower(), (s,t))
s,t=call("POST","/api/orders",{**good,"customer":{**cust,"pin":"012345"}}); check("bad PIN -> 400", s==400 and "PIN" in j(t)["error"], (s,t))
s,t=call("POST","/api/orders",{**good,"items":[{"productId":"x","size":"M","colorName":"Olive","quantity":99}]}); check("quantity 99 -> 400", s==400, (s,t))
s,t=call("POST","/api/orders",{**good,"scenario":"free-money"}); check("unknown payment scenario -> 400", s==400, (s,t))
bad_img={"productId":None,"size":"M","colorName":"Olive","quantity":1,"customization":{"tshirtColor":{"name":"Olive"},"fit":"Regular","layers":[{"id":"i","kind":"image","side":"front","x":50,"y":50,"scale":1,"imageDataUrl":"https://evil.example/x.png"}]}}
s,t=call("POST","/api/orders",{**good,"items":[bad_img]}); check("external image URL in design -> 400", s==400 and "PNG and JPEG" in j(t)["error"], (s,t))
s,t=call("POST","/api/orders",{**good,"items":[{**bad_img,"customization":{**bad_img["customization"],"layers":[]}}]}); check("design with no layers -> 400", s==400, (s,t))
s,t=call("POST","/api/orders",{**good,"total":1,"items":[{**good["items"][0],"unitPrice":1}]})
check("well-formed order reaches the catalogue step (-> 503 when DB unreachable, never 200)", s==503 and "catalogue" in j(t)["error"].lower(), (s,t))
s,t=call("POST","/api/orders",good,headers={"Content-Length":str(7*1024*1024)}) if False else (None,None)
s,t=call("GET","/api/orders/not-a-code"); check("GET malformed code -> 404", s==404, (s,t))
s,t=call("GET","/api/orders/THR-20261121-ABCDEFGH"); check("GET well-formed code with DB down -> 500 JSON (no stack trace leak)", s==500 and set(j(t))=={"error"} and "stack" not in t.lower(), (s,t))
s,t=call("GET","/account/login"); check("login page renders in Supabase mode without demo notice", s==200 and "Demo mode:" not in t and "Log in" in t, s)
s,t=call("GET","/shop"); check("shop FAILS LOUDLY (500) when Supabase is configured but unreachable — no silent seed fallback", s==500, s)
s,t=call("GET","/cart"); check("non-catalogue pages still render during an outage (proxy fail-safe)", s==200, s)
s,t=call("GET","/")
check("homepage also fails loudly rather than showing seed data", s==500, s)
leak=[l for l in (open(LOG).read().splitlines() if LOG and os.path.exists(LOG) else []) if 'fake-service' in l]
check("service-role key never appears in server logs", not leak, leak[:1])

s,t=call("GET","/account/login")
srcs=[u for u in re.findall(r'<script[^>]+src="([^"]+)"',t) if u.startswith("/_next/")]
bundle=t+"".join(call("GET",u)[1] for u in srcs)
check(f"service-role key is absent from the page and all {len(srcs)} client JS files", s==200 and len(srcs)>0 and "fake-service" not in bundle, (s,len(srcs)))
check("server-only code (service-role client) is not referenced by the client bundle", "SUPABASE_SERVICE_ROLE_KEY" not in bundle)
print(f"\n{sum(o for _,o in res)}/{len(res)} passed")
raise SystemExit(0 if all(o for _,o in res) else 1)
