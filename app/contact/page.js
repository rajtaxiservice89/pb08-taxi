import Link from 'next/link';

export default function Contact() {
  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      {/* Background Decor */}
      <div className="hidden md:block absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Get in <span className="text-taxi-yellow text-glow">Touch</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">We are available 24/7. Reach out to us for any queries, bookings, or feedback.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Contact Cards */}
          <div className="space-y-8 lg:col-span-1">
            <div className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-taxi-yellow/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-phone text-taxi-yellow text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 text-lg">Call Us 24/7</h3>
                <a href="tel:9056273306" className="block text-gray-400 hover:text-taxi-yellow transition-colors">9056273306</a>
                <a href="tel:9888079736" className="block text-gray-400 hover:text-taxi-yellow transition-colors mt-1">9888079736</a>
              </div>
            </div>

            <div className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-taxi-yellow/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-envelope text-taxi-yellow text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 text-lg">Email Us</h3>
                <a href="mailto:info@rajtaxi.com" className="block text-gray-400 hover:text-taxi-yellow transition-colors break-all">info@rajtaxi.com</a>
              </div>
            </div>

            <div className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-taxi-yellow/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-location-dot text-taxi-yellow text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 text-lg">Office Address</h3>
                <p className="text-gray-400 leading-relaxed">Main Street, City Center<br/>Jalandhar, Punjab<br/>India</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-panel rounded-2xl p-8 border border-white/10 lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6">Send us a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Your Name</label>
                  <input type="text" className="input-modern" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="input-modern" placeholder="john@example.com" required />
                </div>
              </div>
              <div>
                <label className="form-label">Subject</label>
                <input type="text" className="input-modern" placeholder="How can we help you?" required />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea rows="5" className="input-modern resize-none" placeholder="Write your message here..." required></textarea>
              </div>
              <button type="button" className="btn-primary w-full md:w-auto px-10">Send Message <i className="fa-solid fa-paper-plane ml-2"></i></button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
