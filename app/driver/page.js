"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function DriverAttachment() {
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', vehicleModel: '', vehicleNo: '', experience: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) setStatus('success');
      else {
        alert('Failed to submit application. Try again.');
        setStatus('');
      }
    } catch (e) {
      alert('Network error.');
      setStatus('');
    }
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-taxi-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Attach Your <span className="text-taxi-yellow text-glow">Taxi</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-4">Join our premium fleet and earn on your own schedule.</p>
          <Link href="/driver/login" className="text-taxi-yellow hover:text-white transition-colors border-b border-taxi-yellow pb-1 font-semibold">
            Already registered? Login here <i className="fa-solid fa-arrow-right ml-1 text-sm"></i>
          </Link>
        </div>

        <div className="glass-panel w-full max-w-4xl mx-auto rounded-2xl p-8 md:p-12 border border-white/10">
          
          {status === 'success' ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Application Submitted!</h3>
              <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">Thank you for applying. Our team will review your documents and contact you shortly for the next steps.</p>
              <button onClick={() => setStatus('')} className="btn-outline">Submit Another Application</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Personal Details */}
              <div>
                <h3 className="text-xl font-bold text-taxi-yellow border-b border-white/10 pb-2 mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-user"></i> Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" className="input-modern" required placeholder="Enter full name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Contact Number</label>
                    <input type="tel" className="input-modern" required placeholder="Enter phone number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Complete Address</label>
                    <textarea rows="2" className="input-modern resize-none" required placeholder="Enter your full address"></textarea>
                  </div>
                  <div>
                    <label className="form-label">Aadhar Card Number</label>
                    <input type="text" className="input-modern" required placeholder="12-digit Aadhar number" />
                  </div>
                  <div>
                    <label className="form-label">Driving License Number</label>
                    <input type="text" className="input-modern" required placeholder="DL number" />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-xl font-bold text-taxi-yellow border-b border-white/10 pb-2 mb-6 mt-8 flex items-center gap-3">
                  <i className="fa-solid fa-car"></i> Vehicle Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Car Name / Model</label>
                    <input type="text" className="input-modern" required placeholder="e.g. Maruti Dzire" value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Car Registration Number</label>
                    <input type="text" className="input-modern" required placeholder="e.g. PB08 AA 1234" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Years of Experience</label>
                    <input type="number" className="input-modern" required placeholder="e.g. 5" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div>
                <h3 className="text-xl font-bold text-taxi-yellow border-b border-white/10 pb-2 mb-6 mt-8 flex items-center gap-3">
                  <i className="fa-solid fa-file-arrow-up"></i> Document Uploads
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Selfie / Photo</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Aadhar Card (Front)</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Aadhar Card (Back)</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Driving License</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Car Registration (RC)</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="form-label text-xs">Police Verification</label>
                    <input type="file" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full md:w-auto btn-primary px-12" disabled={status === 'submitting'}>
                  {status === 'submitting' ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Submitting...</> : 'Submit Application'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
