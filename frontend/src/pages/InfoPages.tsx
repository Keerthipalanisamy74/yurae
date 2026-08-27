import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { SEO } from '../components/common/SEO';

export const AboutPage: React.FC = () => (
  <div className="pb-32 xl:pb-24 pt-8 sm:pt-12 max-w-4xl mx-auto px-3 sm:px-4 space-y-8 sm:space-y-12 bg-[#FDF4F7]">
    <SEO
      title="About YURAE — The Philosophy of Botanical Skincare & Luxury"
      description="Learn about Yurae's commitment to botanical integrity, clean Korean formulation chemistry, and minimalist luxury aesthetics."
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'About Yurae', url: '/about' },
      ]}
    />
    <div className="text-center space-y-2 sm:space-y-3">
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Our Story</span>
      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111111]">About Yurae Beauty</h1>
      <p className="text-sm sm:text-base text-gray-700 font-normal italic">"The Origin of Skincare"</p>
    </div>

    <div className="space-y-5 sm:space-y-6 text-xs sm:text-sm text-gray-800 font-normal leading-relaxed p-5 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xs">
      <p>
        Yurae Beauty was founded on a simple premise: skin health should be celebrated with gentle, effective, and ritualistic care rather than harsh abrasives or synthetic masks.
      </p>
      <p>
        Inspired by centuries-old Korean botanical formulations, our laboratory carefully isolates high-purity active extracts—such as 84% Madagascar Centella Asiatica, stabilized L-Ascorbic Acid, and skin-identical ceramides—to fortify your moisture barrier against daily environmental stressors.
      </p>
      <h3 className="font-serif text-xl sm:text-2xl text-[#111111] font-bold pt-2 sm:pt-4">Our Three Pillars</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        <div className="p-4 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl">
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111] mb-1">1. Botanical Integrity</h4>
          <p className="text-xs text-gray-600">We source clean, non-toxic plant extracts verified for maximum bioavailability.</p>
        </div>
        <div className="p-4 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl">
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111] mb-1">2. Soft Luxury</h4>
          <p className="text-xs text-gray-600">Minimalist aesthetics designed to bring elegance and peace to your vanity daily.</p>
        </div>
        <div className="p-4 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl">
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111] mb-1">3. Honest Efficacy</h4>
          <p className="text-xs text-gray-600">Dermatologist-tested formulas that deliver real, glowing, glass-skin results.</p>
        </div>
      </div>
    </div>
  </div>
);

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in your name, email, and message.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        source: 'CONTACT_FORM',
      });

      showToast('Thank you for contacting Yurae Beauty! Your inquiry has been sent to our client advisor team.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit your message. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 xl:pb-24 pt-8 sm:pt-12 max-w-5xl mx-auto px-3 sm:px-4 space-y-8 sm:space-y-12 bg-[#FDF4F7]">
      <SEO
        title="Contact YURAE Concierge & Client Services"
        description="Connect with Yurae's client advisors for questions on botanical formulations, bespoke sizing, styling advice, or order tracking."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Contact Us', url: '/contact' },
        ]}
      />
      <div className="text-center space-y-2 sm:space-y-3">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Client Care</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">Contact Us</h1>
        <p className="text-xs sm:text-sm text-gray-700 font-normal max-w-lg mx-auto">Have a question about a ritual formulation, skincare order, or luxury silk garment? We are here to assist you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        <div className="p-5 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-5 sm:space-y-6 shadow-xs">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#111111]">Get in Touch</h3>
          <div className="space-y-3.5 text-xs sm:text-sm text-gray-700 font-normal">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#D84B7E] shrink-0" />
              <span>care@yuraebeauty.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#D84B7E] shrink-0" />
              <span>+91 98765 43210 (Mon-Sat 10:00 - 19:00 IST)</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#D84B7E] shrink-0 mt-0.5" />
              <span>Yurae Beauty Atelier, Jubilee Hills, Hyderabad, Telangana 500033</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#111111]">Send a Message</h3>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Your Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kiara Advani"
              required
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Subject (Optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Order Inquiry / Routine Advice"
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Message *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message, question, or order details here..."
              required
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 touch-target min-h-[44px] active:scale-98"
          >
            {isSubmitting ? 'Sending Message...' : 'Send Message'} <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => (
  <div className="pb-32 xl:pb-24 pt-8 sm:pt-12 max-w-4xl mx-auto px-3 sm:px-4 space-y-8 sm:space-y-12 bg-[#FDF4F7]">
    <SEO
      title="Frequently Asked Questions & Ritual Guide — YURAE"
      description="Find answers to common questions about Yurae shipping, ingredient sourcing, bespoke fashion sizing, returns, and skincare routines."
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'FAQs', url: '/faq' },
      ]}
    />
    <div className="text-center space-y-2 sm:space-y-3">
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Help Center</span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">Frequently Asked Questions</h1>
    </div>

    <div className="space-y-3.5 sm:space-y-4">
      {[
        { q: 'Are Yurae Beauty formulations safe for sensitive skin?', a: 'Yes. All products are low-pH, non-comedogenic, and free from synthetic dyes and parabens.' },
        { q: 'What is the delivery timeline within India?', a: 'Standard delivery takes 3-5 business days. Express shipping takes 1-2 business days.' },
        { q: 'How do I return a product?', a: 'Unopened products can be returned within 7 days of delivery through your Client Dashboard.' },
        { q: 'Are your products 100% cruelty-free?', a: 'Absolutely. Yurae Beauty does not perform or tolerate animal testing at any phase.' },
      ].map((faq, i) => (
        <div key={i} className="p-4 sm:p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-1.5 sm:space-y-2 shadow-xs">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#111111]">{faq.q}</h3>
          <p className="text-xs sm:text-sm text-gray-700 font-normal">{faq.a}</p>
        </div>
      ))}
    </div>
  </div>
);

