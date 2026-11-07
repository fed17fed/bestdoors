/**
 * Starting texts of the info pages (copied on 2026-11-07 from apps/web/src/content/pages.en.ts, with the
 * company facts from apps/web/src/lib/company.ts). "[TO FILL: …]" marks facts that are still missing.
 * Used only to CREATE missing pages (see seed-pages.ts). Edits made in the admin panel are never overwritten.
 */
export type DefaultPage = {
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
  showInFooter: boolean;
  sortOrder: number;
};

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    "slug": "delivery",
    "title": "Delivery",
    "content": "<h2>Where we deliver</h2>\n<p>[TO FILL: where you deliver, e.g. all of Ireland]</p>\n<p>Online orders can only be delivered to an address in Ireland.</p>\n<h2>Delivery cost</h2>\n<p>Free (shown at checkout before you pay).</p>\n<h2>Delivery time</h2>\n<p>[TO FILL: usual delivery time, e.g. 2–4 weeks after payment]</p>\n<p>We will contact you to agree a delivery day.</p>\n<h2>When the door arrives</h2>\n<ul>\n<li><p>Please check the packaging and the door when it is delivered.</p></li>\n<li><p>If something is damaged or missing, tell us as soon as possible: [TO FILL: customer email, e.g. hello@bestdoors.ie].</p></li>\n<li><p>Your legal rights for damaged or faulty goods are explained on the Returns page.</p></li>\n</ul>",
    "seoTitle": "Delivery",
    "seoDescription": "Delivery of Mr.Door doors in Ireland: areas, times and cost.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 10
  },
  {
    "slug": "returns",
    "title": "Returns and cancellations",
    "content": "<h2>Your right to cancel (14 days)</h2>\n<p>If you buy online as a consumer, you can cancel your order within 14 days after the day you (or a person you name) receive the door. You do not need to give a reason.</p>\n<p>To cancel, send us a clear message before the 14 days end, for example by email to [TO FILL: customer email, e.g. hello@bestdoors.ie]. Please include your order number.</p>\n<h2>Made-to-measure and personalised doors</h2>\n<p>[TO FILL: your rule for made-to-measure doors (the law allows excluding them from the 14-day cancellation right)]</p>\n<h2>Sending the door back</h2>\n<p>[TO FILL: who pays to send a cancelled door back, and how it is collected]</p>\n<p>Please return the door unused, in its original condition and, if possible, in its packaging.</p>\n<h2>Your refund</h2>\n<p>We refund the price you paid, including the standard delivery cost, within 14 days after we receive your cancellation. We use the same payment method you used, unless we agree otherwise.</p>\n<p>We may wait with the refund until we receive the door back or you show proof that you have sent it back, whichever happens first.</p>\n<h2>Faulty or damaged doors</h2>\n<p>If a door is faulty, damaged or not as described, contact us at [TO FILL: customer email, e.g. hello@bestdoors.ie]. This is separate from the 14-day right to cancel. Your statutory rights under Irish consumer law are not affected.</p>",
    "seoTitle": "Returns and cancellations",
    "seoDescription": "Your right to cancel an online order within 14 days, made-to-measure doors, and faulty goods.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 20
  },
  {
    "slug": "contact",
    "title": "Contact us",
    "content": "<p>Questions about a door, your order or a custom size? We are happy to help.</p>\n<h2>Email and phone</h2>\n<ul>\n<li><p>Email: [TO FILL: customer email, e.g. hello@bestdoors.ie]</p></li>\n<li><p>Phone: [TO FILL: phone number]</p></li>\n<li><p>Opening hours: [TO FILL: e.g. Mon–Fri 9:00–17:00]</p></li>\n</ul>\n<h2>Address</h2>\n<p>[TO FILL: company legal name, e.g. Mr.Door Ltd]</p>\n<p>[TO FILL: registered address, with Eircode]</p>\n<h2>Custom doors</h2>\n<p>For a door in a custom size, please use the “Request a quote” form. Add the measurements and a few photos, and we will reply with a personal quote.</p>",
    "seoTitle": "Contact us",
    "seoDescription": "Contact Mr.Door: email, phone and address. Questions about doors, orders or a custom quote.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 30
  },
  {
    "slug": "about",
    "title": "About Mr.Door",
    "content": "<p>Made in Ireland – modern, functional, and reliable.</p>\n<h2>Who we are</h2>\n<p>[TO FILL: a few sentences about the company: since when, who you are, where the doors are made]</p>\n<h2>What we offer</h2>\n<ul>\n<li><p>Interior, exterior, patio, sliding and French doors.</p></li>\n<li><p>An online configurator: choose the size, colour, glass, handle and opening side, and see the price at once.</p></li>\n<li><p>Custom sizes: send us your measurements and photos, and we will prepare a personal quote.</p></li>\n<li><p>Delivery: free – [TO FILL: where you deliver, e.g. all of Ireland].</p></li>\n<li><p>Secure online payment by card, Apple Pay or Google Pay (through Stripe).</p></li>\n</ul>\n<h2>Company details</h2>\n<ul>\n<li><p>[TO FILL: company legal name, e.g. Mr.Door Ltd]</p></li>\n<li><p>Address: [TO FILL: registered address, with Eircode]</p></li>\n<li><p>CRO: [TO FILL: CRO number]</p></li>\n<li><p>VAT: [TO FILL: VAT number, e.g. IE1234567X]</p></li>\n</ul>",
    "seoTitle": "About Mr.Door",
    "seoDescription": "Mr.Door: interior and exterior doors made in Ireland – modern, functional, and reliable.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 40
  },
  {
    "slug": "privacy",
    "title": "Privacy and cookies",
    "content": "<h2>Who is responsible</h2>\n<p>The data controller is [TO FILL: company legal name, e.g. Mr.Door Ltd], [TO FILL: registered address, with Eircode]. Contact for privacy questions: [TO FILL: customer email, e.g. hello@bestdoors.ie].</p>\n<h2>What data we collect and why</h2>\n<table>\n<tbody>\n<tr><th>Data</th><th>Why</th><th>Legal basis (GDPR)</th></tr>\n<tr><td>Name, email, phone, delivery address, order details</td><td>To process and deliver your order</td><td>Contract</td></tr>\n<tr><td>Invoices and payment records</td><td>Tax and accounting duties</td><td>Legal obligation</td></tr>\n<tr><td>Quote request: contact details, sizes, Eircode, message, photos</td><td>To prepare your quote</td><td>Steps before a contract, at your request</td></tr>\n<tr><td>Account: name, email, password (stored encrypted), language</td><td>So you can log in and see your orders</td><td>Contract</td></tr>\n<tr><td>Technical logs (e.g. IP address)</td><td>Security and fixing errors</td><td>Legitimate interest</td></tr>\n</tbody>\n</table>\n<h2>Payments</h2>\n<p>Payments are processed by Stripe. We do not see or store your full card number. Stripe handles your payment data under its own privacy policy.</p>\n<h2>Who receives your data</h2>\n<p>We use these service providers. They process data only for us:</p>\n<ul>\n<li><p>Stripe – online payments</p></li>\n<li><p>Vercel – website hosting and photo storage</p></li>\n<li><p>Neon – database hosting</p></li>\n<li><p>Resend – sending emails (order and quote confirmations)</p></li>\n<li><p>Delivery partners – only the details needed to deliver your door</p></li>\n</ul>\n<h2>Data outside the EU</h2>\n<p>Some of these providers may process data outside the European Economic Area. In that case, safeguards required by the GDPR are used, such as the EU Standard Contractual Clauses.</p>\n<h2>How long we keep data</h2>\n<p>Order and invoice records are kept for 6 years, as required by Irish tax law.</p>\n<p>[TO FILL: how long you keep quote requests and accounts, e.g. quotes 2 years, accounts until deleted]</p>\n<h2>Your rights</h2>\n<ul>\n<li><p>See the data we have about you (access)</p></li>\n<li><p>Correct wrong data</p></li>\n<li><p>Ask us to delete your data</p></li>\n<li><p>Limit or object to how we use it</p></li>\n<li><p>Get your data in a common format (portability)</p></li>\n<li><p>To use these rights, email [TO FILL: customer email, e.g. hello@bestdoors.ie].</p></li>\n<li><p>You can also complain to the Data Protection Commission (www.dataprotection.ie).</p></li>\n</ul>\n<h2>Cookies</h2>\n<p>We only use cookies that are necessary for the website to work. We do not use analytics or advertising cookies.</p>\n<table>\n<tbody>\n<tr><th>Name</th><th>Purpose</th><th>How long</th></tr>\n<tr><td>bd_session</td><td>Keeps you logged in</td><td>7 days</td></tr>\n<tr><td>bd_cart</td><td>Remembers your cart</td><td>30 days</td></tr>\n<tr><td>NEXT_LOCALE</td><td>Remembers your language</td><td>Until you close the browser</td></tr>\n<tr><td>bd_cookie_notice (in your browser storage)</td><td>Remembers that you closed the cookie notice</td><td>Until you clear it</td></tr>\n</tbody>\n</table>\n<h2>Stripe checkout page</h2>\n<p>When you pay, you go to a page run by Stripe. Stripe may set its own cookies there, for example for fraud prevention.</p>",
    "seoTitle": "Privacy and cookies",
    "seoDescription": "How Mr.Door uses your personal data, your GDPR rights, and the cookies on this website.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 50
  },
  {
    "slug": "terms",
    "title": "Terms and conditions",
    "content": "<h2>Who we are</h2>\n<p>This website is run by [TO FILL: company legal name, e.g. Mr.Door Ltd], [TO FILL: registered address, with Eircode]. CRO: [TO FILL: CRO number]. VAT: [TO FILL: VAT number, e.g. IE1234567X]. Email: [TO FILL: customer email, e.g. hello@bestdoors.ie].</p>\n<h2>Prices and payment</h2>\n<ul>\n<li><p>All prices are in euro (€) and include Irish VAT (23%).</p></li>\n<li><p>The price is calculated on our server from your chosen options. The price shown at checkout is the price you pay.</p></li>\n<li><p>You pay online by card, Apple Pay or Google Pay through Stripe.</p></li>\n</ul>\n<h2>Your order and the contract</h2>\n<p>When you pay, you make an offer to buy. The contract starts when we send the order confirmation email.</p>\n<p>If we cannot accept an order (for example because of a clear price error or a product we cannot make), we will tell you and refund the full amount.</p>\n<h2>Delivery</h2>\n<p>We deliver to: [TO FILL: where you deliver, e.g. all of Ireland]. Delivery time: [TO FILL: usual delivery time, e.g. 2–4 weeks after payment]. See the Delivery page for details.</p>\n<h2>Cancellations and returns</h2>\n<p>Your right to cancel and the rules for made-to-measure doors are explained on the Returns page.</p>\n<h2>Custom quotes</h2>\n<p>A quote request is not an order. A quote we send you is valid for the time written in the quote. An order from a quote starts only after you accept it and pay.</p>\n<h2>Product information</h2>\n<p>We try to show colours and materials as correctly as possible. Small differences in colour and wood grain are normal and are not a fault. Pictures may be illustrations.</p>\n<h2>Liability</h2>\n<p>Nothing in these terms limits your statutory rights as a consumer, or our liability where the law does not allow it to be limited.</p>\n<h2>Law</h2>\n<p>These terms are governed by Irish law. You can also bring a claim in the courts of the EU country where you live.</p>",
    "seoTitle": "Terms and conditions",
    "seoDescription": "The terms for buying doors online from Mr.Door.",
    "status": "PUBLISHED",
    "showInFooter": true,
    "sortOrder": 60
  }
];
