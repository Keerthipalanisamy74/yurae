import React, { useState } from 'react';
import { ShieldCheck, Truck, RotateCcw, Lock, FileText, Sparkles, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReturnRefundPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 pb-32 xl:pb-16 space-y-6 sm:space-y-8 bg-[#FDF4F7]">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] text-[#D84B7E] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
          <RotateCcw className="w-3.5 h-3.5" /> 7-Day Guarantee
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Return & Refund Policy</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          We want your Yurae ritual and wardrobe pieces to bring you absolute joy and confidence.
        </p>
      </div>

      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl p-5 sm:p-10 space-y-5 sm:space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">1. Eligibility Window</h2>
          <p>
            You may initiate a return or exchange request within <strong>7 calendar days</strong> of receiving your parcel. 
            All items must be in their original condition, unworn, unwashed, with all original tags attached and packaging intact.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">2. Skincare & Beauty Return Standards</h2>
          <p>
            Due to strict botanical hygiene and quality preservation standards, skincare and lip care products are eligible for return only if:
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-gray-600">
            <li>The item was received damaged, leaking, or compromised during transit.</li>
            <li>An incorrect product or size was dispatched.</li>
            <li>The inner tamper-evident security seal remains completely unopened.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">3. Luxury Apparel & Fashion Exchanges</h2>
          <p>
            Dresses and apparel items are eligible for complimentary size exchanges. If the desired replacement size is unavailable in stock, 
            you may opt for store credit or an immediate full refund to your original payment method.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">4. Refund Timelines</h2>
          <p>
            Once our quality audit team receives and approves the returned parcel (within 24–48 hours of receipt at our Chennai warehouse):
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-gray-600">
            <li><strong>Prepaid Orders (UPI / NetBanking / Cards / Stripe / Razorpay):</strong> Refund is credited within 3–5 business days.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refund is credited via Instant UPI or Direct Bank Transfer (NEFT/IMPS).</li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-[#F1BCCE] pt-5 sm:pt-6">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">Need Assistance with a Return?</h2>
          <p className="text-gray-600">
            Reach out to our concierge team at <a href="mailto:concierge@yuraebeauty.com" className="text-[#D84B7E] font-bold underline">concierge@yuraebeauty.com</a> or message our WhatsApp helpline.
          </p>
        </section>
      </div>
    </div>
  );
};

export const ShippingPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 pb-32 xl:pb-16 space-y-6 sm:space-y-8 bg-[#FDF4F7]">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] text-[#D84B7E] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
          <Truck className="w-3.5 h-3.5" /> Express Dispatch
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Shipping & Delivery Policy</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          Delivering botanical glass skincare and luxury couture across 29,000+ Indian pincodes and worldwide.
        </p>
      </div>

      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl p-5 sm:p-10 space-y-5 sm:space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">1. Processing & Fulfillment Timelines</h2>
          <p>
            Orders placed before 2:00 PM IST (Monday through Saturday) are packed and dispatched on the <strong>same business day</strong>. 
            Orders placed after 2:00 PM or on Sundays/national holidays are dispatched on the next working day.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">2. Domestic Delivery (India)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <div className="p-4 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl">
              <h3 className="font-bold text-[#111111] mb-1 text-sm">Metro Cities</h3>
              <p className="text-xs text-gray-600">Mumbai, Delhi NCR, Bangalore, Chennai, Hyderabad, Kolkata: <strong>1 to 3 Business Days</strong></p>
            </div>
            <div className="p-4 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl">
              <h3 className="font-bold text-[#111111] mb-1 text-sm">Rest of India</h3>
              <p className="text-xs text-gray-600">Tier 2/3 Cities & Regional Towns: <strong>3 to 5 Business Days</strong></p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">3. Shipping Rates & Thresholds</h2>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-gray-600">
            <li><strong>Free Express Shipping:</strong> Available on all domestic orders exceeding ₹999.</li>
            <li><strong>Standard Shipping:</strong> A nominal flat fee of ₹99 applies on orders below ₹999.</li>
            <li><strong>Cash on Delivery (COD):</strong> Complimentary with zero handling surcharge.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">4. Live Package Tracking</h2>
          <p>
            As soon as your package is scanned by our logistics partners (Bluedart, Delhivery, Xpressbees, Shadowfax via Shiprocket), 
            an automated SMS and Email with your tracking link and AWB number is sent to you. You can track your order anytime on our <Link to="/track" className="text-[#D84B7E] font-bold underline">Live Tracking Portal</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 pb-32 xl:pb-16 space-y-6 sm:space-y-8 bg-[#FDF4F7]">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] text-[#D84B7E] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
          <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Privacy Policy</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          Your confidentiality and data privacy are honored with the highest degree of security.
        </p>
      </div>

      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl p-5 sm:p-10 space-y-5 sm:space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">1. Information We Collect</h2>
          <p>
            We collect personal information that you provide when creating an account, browsing our curated collections, placing orders, or contacting our concierge:
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-gray-600">
            <li>Contact Information (Full name, delivery address, email, phone number).</li>
            <li>Account credentials and encrypted passwords.</li>
            <li>Transaction details (Note: We do not store credit card numbers or CVV; all payments are processed through PCI-DSS Level 1 certified gateways Razorpay and Stripe).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">2. How Your Information is Used</h2>
          <p>
            Your information is used strictly to process orders, generate compliant tax invoices, dispatch automated delivery updates, and curate customized skincare recommendations. 
            We do <strong>never sell, lease, or distribute</strong> your personal information to third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">3. Data Security Standards</h2>
          <p>
            All network communication with Yurae is encrypted using industry-standard TLS/SSL encryption. Authentication tokens are digitally signed with cryptographic algorithms.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsConditionsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 pb-32 xl:pb-16 space-y-6 sm:space-y-8 bg-[#FDF4F7]">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] text-[#D84B7E] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
          <FileText className="w-3.5 h-3.5" /> Legal Terms
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Terms & Conditions</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          Please read these terms of service carefully before accessing our storefront.
        </p>
      </div>

      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl p-5 sm:p-10 space-y-5 sm:space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">1. Acceptance of Terms</h2>
          <p>
            By visiting or placing an order on Yurae Beauty (yuraebeauty.com), you acknowledge and agree to be bound by these Terms and Conditions and our associated store policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">2. Product Descriptions & Pricing</h2>
          <p>
            We strive to display our garment colors, fabric textures, and skincare ingredient concentrations with maximum fidelity. 
            All prices are listed in Indian Rupees (INR) or your selected local currency and include applicable Goods & Services Tax (GST).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111]">3. Intellectual Property</h2>
          <p>
            All trademarks, logos, photographs, brand imagery, and editorial descriptions on this site are the exclusive intellectual property of Yurae Beauty & Luxury Apparel PVT LTD.
          </p>
        </section>
      </div>
    </div>
  );
};

export const FAQHelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    {
      category: 'Skincare Rituals',
      question: 'How do I choose the right skincare routine for my skin type?',
      answer: 'Our formulations are tailored for Sensitive, Oily, Dry, Combination, and Acne-Prone skin. You can filter products by skin concern (e.g. Glass Skin Hydration, Brightening, Dark Spots) on our Skincare page. For personalized advice, contact our beauty concierge.'
    },
    {
      category: 'Skincare Rituals',
      question: 'Are Yurae formulations clean, vegan, and cruelty-free?',
      answer: 'Yes! 100% of our botanical formulations are cruelty-free, paraben-free, sulfate-free, and dermatologically tested for delicate and sensitive skin.'
    },
    {
      category: 'Apparel & Sizing',
      question: 'How do I find my exact dress size?',
      answer: 'We provide detailed size guides across XS, S, M, L, XL, XXL, and XXXL. Each product card displays exact measurements for bust, waist, and length. If you are between two sizes, we recommend sizing up for a relaxed fit or contacting us for tailored advice.'
    },
    {
      category: 'Apparel & Sizing',
      question: 'Can I exchange my dress if the size does not fit?',
      answer: 'Absolutely. We offer complimentary 7-day size exchanges. Simply initiate a request from your Account page or message our concierge.'
    },
    {
      category: 'Orders & Shipping',
      question: 'How do I track my shipment?',
      answer: 'Once your order is dispatched, you will receive an SMS and email with your AWB tracking number. You can also visit our Live Tracking page anytime and enter your Order Number.'
    },
    {
      category: 'Orders & Shipping',
      question: 'Is Cash on Delivery (COD) available?',
      answer: 'Yes, we provide Cash on Delivery (COD) with zero handling fees across 29,000+ pincodes in India.'
    },
    {
      category: 'Payments & Security',
      question: 'What payment methods are supported?',
      answer: 'We support all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking, International Cards via Stripe, and Cash on Delivery.'
    }
  ];

  const filteredFaqs = faqItems.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 pb-32 xl:pb-16 space-y-6 sm:space-y-8 bg-[#FDF4F7]">
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] text-[#D84B7E] text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Help & Support
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
          Find instant answers to common questions about our skincare rituals, dress sizing, shipping, and returns.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-3 sm:pt-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-6 sm:top-7" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. sizing, return)..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-[#F8D7E3] border border-[#F1BCCE] rounded-2xl outline-none focus:border-[#D84B7E] text-xs shadow-xs min-h-[44px]"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 pt-2">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No questions found matching "{searchQuery}". Please contact our support concierge.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FCE7F0]/40 transition-colors touch-target min-h-[44px]"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D84B7E] tracking-widest block mb-1">
                      {faq.category}
                    </span>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111]">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="p-1 rounded-full bg-[#FCE7F0] text-[#D84B7E] shrink-0 ml-3">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-[#F1BCCE]/60 animate-in fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Concierge Box */}
      <div className="p-5 sm:p-8 bg-[#111111] text-[#FDF4F7] rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-base sm:text-xl font-bold">Still have questions?</h3>
          <p className="text-xs text-gray-400">Our beauty & styling concierge is ready to assist you 24/7.</p>
        </div>
        <a
          href="mailto:concierge@yuraebeauty.com"
          className="px-6 py-3 bg-[#D84B7E] hover:bg-[#AD1457] text-white text-xs uppercase tracking-widest font-bold rounded-full transition-all shadow-md shrink-0 cursor-pointer touch-target min-h-[44px] flex items-center justify-center"
        >
          Contact Concierge
        </a>
      </div>
    </div>
  );
};

export const PoliciesHubPage: React.FC = () => {
  const policies = [
    {
      title: "Return & Refund Policy",
      desc: "7-day seamless return criteria for apparel & sealed botanical skincare.",
      link: "/return-policy",
      icon: <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "7-Day Guarantee"
    },
    {
      title: "Shipping & Delivery Policy",
      desc: "Dispatch timelines, 29,000+ pincodes coverage, and international logistics.",
      link: "/shipping-policy",
      icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "Express Dispatch"
    },
    {
      title: "Privacy Policy",
      desc: "256-bit SSL encryption, zero third-party data selling, and PCI-DSS compliance.",
      link: "/privacy-policy",
      icon: <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "Data Privacy"
    },
    {
      title: "Terms & Conditions",
      desc: "Store rules, purchase agreements, tax obligations, and intellectual property.",
      link: "/terms-and-conditions",
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "Terms of Use"
    },
    {
      title: "Help & FAQ Center",
      desc: "Frequently asked questions regarding formulations, dress sizing, and order tracking.",
      link: "/faq",
      icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "Live Search"
    },
    {
      title: "About Our Origin",
      desc: "Discover the story, botanical philosophy, and artisan heritage behind Yurae.",
      link: "/about",
      icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#D84B7E]" />,
      badge: "Brand Story"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8 sm:py-14 pb-32 xl:pb-16 space-y-8 sm:space-y-10 bg-[#F8B4CB]">
      <div className="text-center space-y-2 sm:space-y-3">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">
          Client Trust & Compliance
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111111]">
          Policies & Legal Center
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Transparent guidelines crafted to guarantee safety, luxury authenticity, and total peace of mind for every patron.
        </p>
      </div>

      <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {policies.map((p, i) => (
          <Link
            key={i}
            to={p.link}
            className="p-4 sm:p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-3 sm:space-y-4 hover:border-[#D84B7E] hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex justify-between items-start">
                <div className="p-2.5 sm:p-3 bg-[#F8D7E3] rounded-2xl border border-[#F1BCCE] group-hover:scale-105 transition-transform shadow-2xs">
                  {p.icon}
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#D84B7E] bg-[#FCE7F0] px-2.5 py-0.5 sm:py-1 rounded-full">
                  {p.badge}
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#D84B7E] transition-colors">
                {p.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {p.desc}
              </p>
            </div>

            <div className="pt-2 text-xs font-bold text-[#D84B7E] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Read Policy →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};


