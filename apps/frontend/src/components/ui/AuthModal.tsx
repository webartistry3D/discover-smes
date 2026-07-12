import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../ui/index';
import { isValidNigerianPhone, formatPhoneNumber } from '../../lib/shared';
import { clsx } from 'clsx';

type Mode = 'login' | 'register';
type Step = 'form' | 'success';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, isDarkMode } = useUIStore();
  const { setUser } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (res) => {
      setUser(res.data.user, res.data.tokens);
      setStep('success');
      setTimeout(() => {
        closeAuthModal();
        resetForm();
        // Route SUPER_ADMIN to admin panel
        if (res.data.user.role === 'SUPER_ADMIN') {
          window.location.href = '/admin';
        }
      }, 1500);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const registerMutation = useMutation({
    mutationFn: async ({ phone, password, firstName, lastName }: { phone: string; password: string; firstName: string; lastName: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, firstName, lastName }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: (res) => {
      setUser(res.data.user, res.data.tokens);
      setStep('success');
      setTimeout(() => {
        closeAuthModal();
        resetForm();
      }, 1500);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetForm = () => {
    setStep('form');
    setPhone('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  const handleClose = () => {
    closeAuthModal();
    setTimeout(resetForm, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNigerianPhone(phone)) {
      toast.error('Please enter a valid Nigerian phone number');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (mode === 'register' && (!firstName || !lastName)) {
      toast.error('Please enter your first and last name');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (mode === 'login') {
      loginMutation.mutate({ phone: formattedPhone, password });
    } else {
      registerMutation.mutate({ phone: formattedPhone, password, firstName, lastName });
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className={clsx('rounded-3xl shadow-2xl overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              {/* Header */}
              <div className="relative bg-gradient-hero px-6 pt-8 pb-10 text-white overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    {step === 'success' ? <CheckCircle size={22} /> : <Lock size={22} />}
                  </div>
                  <h2 className="font-display font-bold text-xl">
                    {step === 'form' ? (mode === 'login' ? 'Welcome back' : 'Create account') : 'You\'re in! 🎉'}
                  </h2>
                  <p className="text-white/70 text-sm mt-1">
                    {step === 'form'
                      ? (mode === 'login' ? 'Sign in to your account' : 'Join Discover SMEs today')
                      : 'Redirecting you now...'}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className={clsx('px-6 py-6', isDarkMode ? 'bg-gray-800' : '')}>
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={clsx('text-sm font-medium mb-1.5 block', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>First Name</label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="John"
                              className={clsx('input w-full', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : '')}
                            />
                          </div>
                          <div>
                            <label className={clsx('text-sm font-medium mb-1.5 block', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Last Name</label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Doe"
                              className={clsx('input w-full', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : '')}
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className={clsx('text-sm font-medium mb-1.5 block', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Phone Number</label>
                        <div className="flex items-center gap-2">
                          <div className={clsx('flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium flex-shrink-0', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600')}>
                            🇳🇬 +234
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0801 234 5678"
                            className={clsx('input flex-1', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : '')}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div>
                        <label className={clsx('text-sm font-medium mb-1.5 block', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={clsx('input w-full pr-10', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : '')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={clsx('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loginMutation.isPending || registerMutation.isPending}
                        icon={<ArrowRight size={16} />}
                        iconPosition="right"
                        className="w-full"
                      >
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                      </Button>
                      <p className={clsx('text-xs text-center', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                      </p>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                          className={clsx('text-sm transition-colors', isDarkMode ? 'text-festac-green hover:text-festac-green/80' : 'text-festac-green hover:text-festac-green/80')}
                        >
                          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 flex flex-col items-center gap-3"
                    >
                      <div className={clsx('w-16 h-16 rounded-full flex items-center justify-center', isDarkMode ? 'bg-green-900/30' : 'bg-green-100')}>
                        <CheckCircle size={32} className={clsx(isDarkMode ? 'text-green-400' : 'text-green-600')} />
                      </div>
                      <p className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Successfully logged in!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
