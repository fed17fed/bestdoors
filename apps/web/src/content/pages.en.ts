import type { PageTexts } from "./types";

export const pagesEn: PageTexts = {
  about: (c) => ({
    title: "About Mr.Door",
    description: "Mr.Door: interior and exterior doors made in Ireland – modern, functional, and reliable.",
    legal: false,
    intro: "Made in Ireland – modern, functional, and reliable.",
    sections: [
      { heading: "Who we are", paragraphs: [c.story] },
      {
        heading: "What we offer",
        list: [
          "Interior, exterior, patio, sliding and French doors.",
          "An online configurator: choose the size, colour, glass, handle and opening side, and see the price at once.",
          "Custom sizes: send us your measurements and photos, and we will prepare a personal quote.",
          `Delivery: ${c.deliveryCost.toLowerCase()} – ${c.deliveryAreas}.`,
          "Secure online payment by card, Apple Pay or Google Pay (through Stripe).",
        ],
      },
      { heading: "Company details", list: [`${c.legalName}`, `Address: ${c.address}`, `CRO: ${c.croNumber}`, `VAT: ${c.vatNumber}`] },
    ],
  }),

  contact: (c) => ({
    title: "Contact us",
    description: "Contact Mr.Door: email, phone and address. Questions about doors, orders or a custom quote.",
    legal: false,
    intro: "Questions about a door, your order or a custom size? We are happy to help.",
    sections: [
      { heading: "Email and phone", list: [`Email: ${c.email}`, `Phone: ${c.phone}`, `Opening hours: ${c.openingHours}`] },
      { heading: "Address", paragraphs: [c.legalName, c.address] },
      {
        heading: "Custom doors",
        paragraphs: ["For a door in a custom size, please use the “Request a quote” form. Add the measurements and a few photos, and we will reply with a personal quote."],
      },
    ],
  }),

  delivery: (c) => ({
    title: "Delivery",
    description: "Delivery of Mr.Door doors in Ireland: areas, times and cost.",
    legal: false,
    sections: [
      { heading: "Where we deliver", paragraphs: [c.deliveryAreas, "Online orders can only be delivered to an address in Ireland."] },
      { heading: "Delivery cost", paragraphs: [`${c.deliveryCost} (shown at checkout before you pay).`] },
      { heading: "Delivery time", paragraphs: [c.deliveryTime, "We will contact you to agree a delivery day."] },
      {
        heading: "When the door arrives",
        list: [
          "Please check the packaging and the door when it is delivered.",
          `If something is damaged or missing, tell us as soon as possible: ${c.email}.`,
          "Your legal rights for damaged or faulty goods are explained on the Returns page.",
        ],
      },
    ],
  }),

  returns: (c) => ({
    title: "Returns and cancellations",
    description: "Your right to cancel an online order within 14 days, made-to-measure doors, and faulty goods.",
    legal: true,
    sections: [
      {
        heading: "Your right to cancel (14 days)",
        paragraphs: [
          "If you buy online as a consumer, you can cancel your order within 14 days after the day you (or a person you name) receive the door. You do not need to give a reason.",
          `To cancel, send us a clear message before the 14 days end, for example by email to ${c.email}. Please include your order number.`,
        ],
      },
      { heading: "Made-to-measure and personalised doors", paragraphs: [c.customDoorsRule] },
      { heading: "Sending the door back", paragraphs: [c.returnShipping, "Please return the door unused, in its original condition and, if possible, in its packaging."] },
      {
        heading: "Your refund",
        paragraphs: [
          "We refund the price you paid, including the standard delivery cost, within 14 days after we receive your cancellation. We use the same payment method you used, unless we agree otherwise.",
          "We may wait with the refund until we receive the door back or you show proof that you have sent it back, whichever happens first.",
        ],
      },
      {
        heading: "Faulty or damaged doors",
        paragraphs: [
          `If a door is faulty, damaged or not as described, contact us at ${c.email}. This is separate from the 14-day right to cancel. Your statutory rights under Irish consumer law are not affected.`,
        ],
      },
    ],
  }),

  privacy: (c) => ({
    title: "Privacy and cookies",
    description: "How Mr.Door uses your personal data, your GDPR rights, and the cookies on this website.",
    legal: true,
    sections: [
      { heading: "Who is responsible", paragraphs: [`The data controller is ${c.legalName}, ${c.address}. Contact for privacy questions: ${c.email}.`] },
      {
        heading: "What data we collect and why",
        table: [
          ["Data", "Why", "Legal basis (GDPR)"],
          ["Name, email, phone, delivery address, order details", "To process and deliver your order", "Contract"],
          ["Invoices and payment records", "Tax and accounting duties", "Legal obligation"],
          ["Quote request: contact details, sizes, Eircode, message, photos", "To prepare your quote", "Steps before a contract, at your request"],
          ["Account: name, email, password (stored encrypted), language", "So you can log in and see your orders", "Contract"],
          ["Technical logs (e.g. IP address)", "Security and fixing errors", "Legitimate interest"],
        ],
      },
      {
        heading: "Payments",
        paragraphs: ["Payments are processed by Stripe. We do not see or store your full card number. Stripe handles your payment data under its own privacy policy."],
      },
      {
        heading: "Who receives your data",
        paragraphs: ["We use these service providers. They process data only for us:"],
        list: [
          "Stripe – online payments",
          "Vercel – website hosting and photo storage",
          "Neon – database hosting",
          "Resend – sending emails (order and quote confirmations)",
          "Delivery partners – only the details needed to deliver your door",
        ],
      },
      {
        heading: "Data outside the EU",
        paragraphs: ["Some of these providers may process data outside the European Economic Area. In that case, safeguards required by the GDPR are used, such as the EU Standard Contractual Clauses."],
      },
      {
        heading: "How long we keep data",
        paragraphs: ["Order and invoice records are kept for 6 years, as required by Irish tax law.", c.dataRetention],
      },
      {
        heading: "Your rights",
        list: [
          "See the data we have about you (access)",
          "Correct wrong data",
          "Ask us to delete your data",
          "Limit or object to how we use it",
          "Get your data in a common format (portability)",
          `To use these rights, email ${c.email}.`,
          "You can also complain to the Data Protection Commission (www.dataprotection.ie).",
        ],
      },
      {
        id: "cookies",
        heading: "Cookies",
        paragraphs: ["We only use cookies that are necessary for the website to work. We do not use analytics or advertising cookies."],
        table: [
          ["Name", "Purpose", "How long"],
          ["bd_session", "Keeps you logged in", "7 days"],
          ["bd_cart", "Remembers your cart", "30 days"],
          ["NEXT_LOCALE", "Remembers your language", "Until you close the browser"],
          ["bd_cookie_notice (in your browser storage)", "Remembers that you closed the cookie notice", "Until you clear it"],
        ],
      },
      { heading: "Stripe checkout page", paragraphs: ["When you pay, you go to a page run by Stripe. Stripe may set its own cookies there, for example for fraud prevention."] },
    ],
  }),

  terms: (c) => ({
    title: "Terms and conditions",
    description: "The terms for buying doors online from Mr.Door.",
    legal: true,
    sections: [
      { heading: "Who we are", paragraphs: [`This website is run by ${c.legalName}, ${c.address}. CRO: ${c.croNumber}. VAT: ${c.vatNumber}. Email: ${c.email}.`] },
      {
        heading: "Prices and payment",
        list: [
          "All prices are in euro (€) and include Irish VAT (23%).",
          "The price is calculated on our server from your chosen options. The price shown at checkout is the price you pay.",
          "You pay online by card, Apple Pay or Google Pay through Stripe.",
        ],
      },
      {
        heading: "Your order and the contract",
        paragraphs: [
          "When you pay, you make an offer to buy. The contract starts when we send the order confirmation email.",
          "If we cannot accept an order (for example because of a clear price error or a product we cannot make), we will tell you and refund the full amount.",
        ],
      },
      { heading: "Delivery", paragraphs: [`We deliver to: ${c.deliveryAreas}. Delivery time: ${c.deliveryTime}. See the Delivery page for details.`] },
      { heading: "Cancellations and returns", paragraphs: ["Your right to cancel and the rules for made-to-measure doors are explained on the Returns page."] },
      {
        heading: "Custom quotes",
        paragraphs: ["A quote request is not an order. A quote we send you is valid for the time written in the quote. An order from a quote starts only after you accept it and pay."],
      },
      {
        heading: "Product information",
        paragraphs: ["We try to show colours and materials as correctly as possible. Small differences in colour and wood grain are normal and are not a fault. Pictures may be illustrations."],
      },
      {
        heading: "Liability",
        paragraphs: ["Nothing in these terms limits your statutory rights as a consumer, or our liability where the law does not allow it to be limited."],
      },
      { heading: "Law", paragraphs: ["These terms are governed by Irish law. You can also bring a claim in the courts of the EU country where you live."] },
    ],
  }),
};
