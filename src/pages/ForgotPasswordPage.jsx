import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, Send } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-toastify';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please provide an email address');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F17] to-black relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-white shadow-xl shadow-cyan-500/30 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Reset Admin Password</h1>
          <p className="text-xs text-slate-400 mt-1">Smart Tourist Safety Monitoring System</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered admin email address below. We will dispatch a 2-Factor verification link and OTP token.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@stsms.gov"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">Reset Link Dispatched</h3>
              <p className="text-xs text-slate-300">
                If an account matches <span className="text-cyan-400 font-mono">{email}</span>, you will receive recovery instructions shortly.
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
