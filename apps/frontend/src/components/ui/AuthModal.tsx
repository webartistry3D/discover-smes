import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../lib/api';
import { Button } from '../ui/index';
import { isValidNigerianPhone, formatPhoneNumber } from '../../lib/shared';

type Step = 'phone' | 'otp' | 'success';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useUIStore();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = Array.from({ length: 6 }, () => null as HTMLInputElement | null);

  const sendOtpMutation = useMutation({
    mutationFn: (p: string) => authApi.sendOtp(p),
    onSuccess: () => {
      setStep('otp');
      toast.success('OTP sent to your phone');
    },
    onError: () => toast.error('Failed to send OTP. Please try again.'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ p, code }: { p: string; code: string }) => authApi.verifyOtp(p, code),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data;
      setUser(user, tokens);
      setStep('success');
      setTimeout(() => {
        closeAuthModal();
        resetForm();
      }, 1500);
    },
    onError: () => toast.error('Invalid OTP. Please try again.'),
  });

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
  };

  const handleClose = () => {
    closeAuthModal();
    setTimeout(resetForm, 300);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNigerianPhone(phone)) {
      toast.error('Please enter a valid Nigerian phone number');
      return;
    }
    sendOtpMutation.mutate(formatPhoneNumber(phone));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1]?.focus();

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d) && value) {
      verifyOtpMutation.mutate({ p: formatPhoneNumber(phone), code: newOtp.join('') });
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      verifyOtpMutation.mutate({ p: formatPhoneNumber(phone), code: paste });
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[101]"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-hero px-6 pt-8 pb-10 text-white overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    {step === 'success' ? <CheckCircle size={22} /> : <Phone size={22} />}
                  </div>
                  <h2 className="font-display font-bold text-xl">
                    {step === 'phone' ? 'Welcome to Discover Festac' : step === 'otp' ? 'Verify your number' : 'You\'re in! 🎉'}
                  </h2>
                  <p className="text-white/70 text-sm mt-1">
                    {step === 'phone'
                      ? 'Enter your phone number to continue'
                      : step === 'otp'
                      ? `OTP sent to ${phone}`
                      : 'Redirecting you now...'}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  {step === 'phone' && (
                    <motion.form
                      key="phone"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handlePhoneSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium flex-shrink-0">
                            🇳🇬 +234
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0801 234 5678"
                            className="input flex-1"
                            autoFocus
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={sendOtpMutation.isPending}
                        icon={<ArrowRight size={16} />}
                        iconPosition="right"
                        className="w-full"
                      >
                        Send OTP
                      </Button>
                      <p className="text-xs text-gray-400 text-center">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                      </p>
                    </motion.form>
                  )}

                  {step === 'otp' && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-3 block">Enter 6-digit code</label>
                        <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpRefs[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none focus:border-brand-500 transition-colors bg-gray-50 focus:bg-white"
                              style={{ borderColor: digit ? '#1B5E20' : undefined }}
                            />
                          ))}
                        </div>
                      </div>

                      {verifyOtpMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          Verifying...
                        </div>
                      )}

                      <button
                        onClick={() => sendOtpMutation.mutate(formatPhoneNumber(phone))}
                        disabled={sendOtpMutation.isPending}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-festac-green transition-colors mx-auto"
                      >
                        <RotateCcw size={13} />
                        Resend OTP
                      </button>

                      <button onClick={() => setStep('phone')} className="text-xs text-gray-400 hover:text-gray-600 block text-center w-full">
                        ← Change phone number
                      </button>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={32} className="text-green-600" />
                      </div>
                      <p className="font-semibold text-gray-900">Successfully logged in!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
