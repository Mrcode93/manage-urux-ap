import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = 'اسم المستخدم مطلوب';
    }

    if (!password.trim()) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-arabic transition-colors duration-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex relative mb-6"
          >
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 animate-pulse"></div>
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tight transition-colors">
              URUX <span className="text-blue-500">MANAGEMENT</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              نظام الإدارة المتكامل
              <Sparkles className="w-3 h-3 text-blue-500" />
            </p>
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 sm:p-10 border-white/20 dark:border-white/10 relative overflow-hidden shadow-2xl shadow-blue-500/5"
        >
          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white italic mb-1 transition-colors">تسجيل الدخول</h2>
              <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">يرجى إدخال بيانات الاعتماد للوصول</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">اسم المستخدم</label>
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full bg-slate-100/50 dark:bg-slate-900/50 border ${formErrors.username ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20'} rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600`}
                    placeholder="Username"
                  />
                </div>
                <AnimatePresence>
                  {formErrors.username && (
                    <motion.p
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="text-[10px] font-black text-red-500 px-1 mt-1 flex items-center gap-1"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" /> {formErrors.username}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-slate-100/50 dark:bg-slate-900/50 border ${formErrors.password ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20'} rounded-2xl py-4 pr-12 pl-12 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {formErrors.password && (
                    <motion.p
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="text-[10px] font-black text-red-500 px-1 mt-1 flex items-center gap-1"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" /> {formErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>جاري التحقق...</span>
                    </div>
                  ) : (
                    <>
                      <span>دخــــــــول</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                System V.2.0 • Secured Access Only
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer Credits */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
        >
          © 2024 URUX Tech Inc. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
