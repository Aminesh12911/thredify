export interface PolicySection { heading: string; body: string[]; list?: string[] }
export interface Policy { slug: string; title: string; short: string; description: string; sections: PolicySection[] }

export const POLICY_UPDATED = "22 November 2026";

export const policies: Policy[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    short: "What we collect and why",
    description: "How THREADIFY (a demo store) handles personal information: what is collected, why, where it is stored and your choices.",
    sections: [
      { heading: "1. About this demo", body: ["THREADIFY is an academic demonstration store. Please use fictional details only. This draft describes how the site is designed to handle information so that it can be reviewed before any real use."] },
      { heading: "2. Information we handle", body: ["Depending on what you do on the site, the following may be processed:"], list: [
        "Account details: name, email address, phone number, and a password (stored only as a salted hash by the authentication provider — never in readable form).",
        "Order details: delivery name, address, phone, email, items, custom designs and uploaded artwork, order totals and order status.",
        "Saved addresses you choose to store in your account.",
        "Messages you send through the contact form.",
        "Basic technical data such as the cookies needed to keep you signed in."] },
      { heading: "3. Payment information", body: ["The checkout is a sandbox. We do not ask for, receive or store card numbers, CVV codes, UPI PINs, net-banking credentials or any other payment credentials. Only the simulated payment method label and outcome are recorded against an order."] },
      { heading: "4. Why we use information", body: ["To create and manage your account, process and track orders, answer your messages, keep the service secure and prevent abuse. We do not sell personal information and this demo does not run advertising or third-party analytics."] },
      { heading: "5. Where it is stored", body: ["In demo mode, data stays in your own browser (local storage) and never leaves your device. When connected to a database, data is held in the configured Supabase project, protected by row-level security so customers can only read their own records; administrators can view orders and enquiries to fulfil them."] },
      { heading: "6. Cookies and local storage", body: ["We use strictly necessary cookies / local storage to keep you signed in and remember your cart. No marketing cookies are set."] },
      { heading: "7. Your choices", body: ["You can ask to access, correct or delete your data by contacting us using the details on the Contact Information page. You can clear browser storage at any time to remove demo-mode data."] },
      { heading: "8. Review required", body: ["This is a draft for a student project. Before real commercial use it must be reviewed by a qualified professional against the laws that apply to the business, which in India include the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000 and rules made under them."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    short: "Rules for using the store",
    description: "Sample terms of use for the THREADIFY demo store: orders, custom designs, intellectual property and liability.",
    sections: [
      { heading: "1. Demonstration store", body: ["THREADIFY is a non-commercial academic project. No goods are produced or shipped and no real payments are taken. Nothing on this site is an offer capable of acceptance."] },
      { heading: "2. Using the site", body: ["You agree to use the site lawfully, to give accurate fictional information, and not to attempt to disrupt, scrape heavily, or gain unauthorised access to any part of it, including the admin area."] },
      { heading: "3. Orders and pricing (as designed)", body: ["Prices are shown in Indian Rupees and are recalculated by the server at checkout from the current catalogue, so a price shown in your browser can never override the real price. In a real shop, an order would be confirmed only after payment succeeds and stock is available, and the shop could cancel and refund an order it cannot fulfil."] },
      { heading: "4. Custom designs and uploaded artwork", body: ["By uploading artwork you confirm that you own it or have permission to use it, and that it does not infringe another person's copyright, trademark or personality rights, and is not unlawful, hateful or sexually explicit. A real shop would be entitled to refuse or cancel any design it considers inappropriate, with a refund."] },
      { heading: "5. Intellectual property", body: ["The THREADIFY name, ready-made designs and site content belong to the project authors. You keep ownership of artwork you upload."] },
      { heading: "6. Accounts", body: ["Keep your password confidential. Tell us if you suspect unauthorised use. We may suspend accounts that abuse the service."] },
      { heading: "7. Limitation of liability", body: ["The site is provided “as is” for educational purposes. To the extent permitted by law, the authors are not liable for losses arising from use of this demo."] },
      { heading: "8. Governing law and review", body: ["A real business would specify governing law and a dispute process here. This draft has not been reviewed by a lawyer and must be reviewed, and the sample details replaced, before any commercial use."] },
    ],
  },
  {
    slug: "refunds",
    title: "Refund & Cancellation Policy",
    short: "Cancelling, returns and refunds",
    description: "Sample refund and cancellation policy for THREADIFY: cancellation window, returns, defective items and how refunds would be processed.",
    sections: [
      { heading: "1. Demo notice", body: ["No real payments are taken, so no real refunds exist. This page shows the policy a real shop might adopt and which the demo order statuses are designed around."] },
      { heading: "2. Cancelling an order", body: ["An order can be cancelled free of charge while its status is “Order placed” or “Processing”. Once it reaches “Printing”, production has begun and it can no longer be cancelled, because custom items cannot be resold."] },
      { heading: "3. Ready-made T-shirts: returns", body: ["Unworn, unwashed items with tags can be returned within 7 days of delivery for a refund or exchange of size. Return shipping may be charged unless the item is faulty or wrong."] },
      { heading: "4. Custom-printed T-shirts", body: ["Because they are made to order, custom items are not returnable for change of mind. We would replace or refund an item that arrives defective, damaged, misprinted compared with your approved design, or in the wrong size compared with your order."] },
      { heading: "5. Reporting a problem", body: ["Contact us within 48 hours of delivery with your order ID and photos of the issue so we can resolve it quickly."] },
      { heading: "6. How refunds would work", body: ["Approved refunds would go back to the original payment method within 5–7 working days of approval. Shipping charges are refunded only if the problem was our error."] },
      { heading: "7. Failed or duplicate payments", body: ["If a payment fails, no order is created and nothing is charged. If you believe you were charged twice, contact us with your order ID."] },
      { heading: "8. Review required", body: ["Draft only. Real return and refund terms must follow applicable consumer-protection rules and be reviewed before commercial use."] },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    short: "Delivery times, charges and tracking",
    description: "Sample shipping policy for THREADIFY: delivery areas, estimated times, charges, free shipping threshold and order tracking.",
    sections: [
      { heading: "1. Demo notice", body: ["Nothing is shipped from this demo store. The details below are the sample policy the checkout is built around."] },
      { heading: "2. Where we would deliver", body: ["Addresses across India with a valid 6-digit PIN code. International shipping is not offered in this sample."] },
      { heading: "3. Charges", body: ["Orders of ₹999 or more ship free. Smaller orders pay a flat ₹79. The shipping amount is shown in your cart and again at checkout before you pay."] },
      { heading: "4. Estimated delivery", body: ["These are estimates, not guarantees:"], list: [
        "Ready-made T-shirts: dispatched in 1–2 working days, delivered in 3–5 working days.",
        "Custom-printed T-shirts: printed in 2–3 working days, then delivered in 3–5 working days (5–8 in total).",
        "Remote locations can take longer."] },
      { heading: "5. Order status and tracking", body: ["Every order has an ID like THR-20261001-ABCDE. Use Track Order to see it move through Order placed → Processing → Printing → Shipped → Delivered. No email or SMS notifications are sent by this demo."] },
      { heading: "6. Incorrect addresses", body: ["Please check your address before paying. If an order is returned to us because of an incorrect address, re-shipping could be charged."] },
      { heading: "7. Damaged in transit", body: ["If your parcel arrives damaged, contact us within 48 hours with photos so we can arrange a replacement."] },
    ],
  },
  {
    slug: "contact-information",
    title: "Contact Information",
    short: "How to reach us (sample details)",
    description: "Sample contact and business details for THREADIFY, a demonstration store. All details are placeholders.",
    sections: [
      { heading: "Sample details", body: ["The details below are placeholders for a student project. Replace them with real, verified information before any commercial use — including, where applicable, the registered business name, address, grievance officer and GST details that Indian e-commerce rules expect a seller to display."] },
    ],
  },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
