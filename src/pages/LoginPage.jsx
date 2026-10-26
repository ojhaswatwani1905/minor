import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both admin email and password');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.admin.name}!`);
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F5F7] dark:bg-[#161618] relative overflow-hidden transition-colors">
      {/* Background Glowing Ambient Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#007AFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#32ADE6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#007AFF] to-[#32ADE6] text-white shadow-xl shadow-blue-500/20 mb-4 ring-8 ring-blue-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            STSMS Admin Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Smart Tourist Safety & Emergency Command System
          </p>
        </div>

        {/* Apple Glass Card */}
        <div className="apple-glass p-8 rounded-3xl shadow-apple dark:shadow-apple-dark border border-slate-200/80 dark:border-[#38383A] bg-white/80 dark:bg-[#242426]/80 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stsms.gov"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#161618] border border-slate-300/60 dark:border-[#38383A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#007AFF] hover:underline font-bold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#161618] border border-slate-300/60 dark:border-[#38383A] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
                <input type="checkbox" defaultChecked className="rounded-md bg-slate-200 dark:bg-[#161618] border-slate-300 dark:border-slate-700 text-[#007AFF] focus:ring-[#007AFF]/50" />
                <span>Keep me authenticated</span>
              </label>
              <span className="text-[10px] text-[#007AFF] font-mono font-bold">256-bit Encrypted</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#38383A] text-center text-xs text-slate-500">
            Don't have an admin profile?{' '}
            <Link to="/register" className="text-[#007AFF] font-bold hover:underline">
              Register New Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
