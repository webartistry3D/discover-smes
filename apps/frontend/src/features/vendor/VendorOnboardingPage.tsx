import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, Phone, Tag, ChevronRight, ChevronLeft, CheckCircle, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCategories } from '../../hooks/useVendors';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { Button } from '../../components/ui/index';
import { vendorApi } from '../../lib/api';
import { FESTAC_WARDS, isValidNigerianPhone, formatPhoneNumber } from '../../lib/shared';

const STEPS = [
  { id: 1, title: 'Business Info', icon: <Store size={16} /> },
  { id: 2, title: 'Location', icon: <MapPin size={16} /> },
  { id: 3, title: 'Contact & Category', icon: <Phone size={16} /> },
  { id: 4, title: 'Review & Submit', icon: <CheckCircle size={16} /> },
];

interface FormData {
  businessName: string;
  description: string;
  businessType: 'PRODUCT' | 'SERVICE' | 'HYBRID';
  priceRange: 'BUDGET' | 'MID_RANGE' | 'PREMIUM';
  address: string;
  ward: string;
  lga: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  categoryId: string;
  deliveryAvailable: boolean;
  tags: string;
}

const INITIAL_FORM: FormData = {
  businessName: '',
  description: '',
  businessType: 'SERVICE',
  priceRange: 'MID_RANGE',
  address: '',
  ward: '',
  lga: 'Amuwo-Odofin',
  phone: '',
  whatsappPhone: '',
  email: '',
  categoryId: '',
  deliveryAvailable: false,
  tags: '',
};

export default function VendorOnboardingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const { data: categories } = useCategories();

  const createVendor = useMutation({
    mutationFn: (data: Omit<FormData, 'tags'> & { tags: string[] }) => vendorApi.create(data),
    onSuccess: () => {
      toast.success('Business listed successfully! Pending approval.');
      navigate('/dashboard');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Failed to create listing');
    },
  });

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.businessName.trim()) { toast.error('Business name is required'); return false; }
        if (form.description.trim().length < 20) { toast.error('Description must be at least 20 characters'); return false; }
        return true;
      case 2:
        if (!form.address.trim()) { toast.error('Address is required'); return false; }
        return true;
      case 3:
        if (!form.phone || !isValidNigerianPhone(form.phone)) { toast.error('Valid phone number required'); return false; }
        if (!form.categoryId) { toast.error('Please select a category'); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to list your business');
      openAuthModal();
      return;
    }

    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    createVendor.mutate({
      ...form,
      phone: formatPhoneNumber(form.phone),
      whatsappPhone: form.whatsappPhone ? formatPhoneNumber(form.whatsappPhone) : undefined,
      tags,
    } as any);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="font-display font-black text-2xl">List Your Business</h1>
          <p className="text-white/70 text-sm mt-1">Join 2,400+ businesses on Discover Festac — Free forever</p>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s) => (
                <div key={s.id} className={`flex items-center gap-1.5 text-xs font-medium ${s.id <= step ? 'text-white' : 'text-white/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.id < step ? 'bg-festac-amber' : s.id === step ? 'bg-white text-festac-green' : 'bg-white/20'}`}>
                    {s.id < step ? '✓' : s.id}
                  </div>
                  <span className="hidden sm:block">{s.title}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
              <motion.div
                className="bg-festac-amber h-1.5 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-2 pt-6">
        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Business Info ─────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepCard title="Business Information" icon={<Store size={18} className="text-festac-green" />}>
                <div className="space-y-4">
                  <Field label="Business Name *" hint="As it appears on your signage">
                    <input type="text" value={form.businessName} onChange={(e) => update('businessName', e.target.value)}
                      placeholder="e.g. Mama Ngozi's Kitchen" className="input" maxLength={100} />
                  </Field>

                  <Field label="Business Description *" hint="Min 20 characters — describe what you offer">
                    <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                      placeholder="Tell potential customers what you do, what makes you special, what products/services you offer..."
                      rows={4} className="input resize-none" maxLength={2000} />
                    <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
                  </Field>

                  <Field label="Business Type *">
                    <div className="grid grid-cols-3 gap-2">
                      {(['PRODUCT', 'SERVICE', 'HYBRID'] as const).map((type) => (
                        <button key={type} onClick={() => update('businessType', type)}
                          className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors ${form.businessType === type ? 'border-festac-green bg-green-50 text-festac-green' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                          {type === 'HYBRID' ? 'Both' : type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Price Range *">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'BUDGET', label: 'Budget', desc: '₦1,000 - ₦10,000' },
                        { value: 'MID_RANGE', label: 'Mid-Range', desc: '₦11,000 - ₦40,000' },
                        { value: 'PREMIUM', label: 'Premium', desc: '₦40,000+' },
                      ].map((pr) => (
                        <button key={pr.value} onClick={() => update('priceRange', pr.value as any)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border-2 transition-colors text-center ${form.priceRange === pr.value ? 'border-festac-green bg-green-50 text-festac-green' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                          <div>{pr.label}</div>
                          <div className="text-2xs opacity-70">{pr.desc}</div>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ─── STEP 2: Location ─────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepCard title="Location Details" icon={<MapPin size={18} className="text-festac-green" />}>
                <div className="space-y-4">
                  <Field label="Street Address *">
                    <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)}
                      placeholder="e.g. 21 Avenue Road, Festac Town" className="input" />
                  </Field>

                  <Field label="Ward / Area">
                    <select value={form.ward} onChange={(e) => update('ward', e.target.value)} className="input">
                      <option value="">Select ward/area</option>
                      {FESTAC_WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>

                  <Field label="LGA">
                    <input type="text" value={form.lga} onChange={(e) => update('lga', e.target.value)}
                      placeholder="e.g. Amuwo-Odofin" className="input" defaultValue="Amuwo-Odofin" />
                  </Field>

                  <Field label="Delivery Available">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${form.deliveryAvailable ? 'bg-festac-green' : 'bg-gray-200'}`}
                        onClick={() => update('deliveryAvailable', !form.deliveryAvailable)}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.deliveryAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-700">{form.deliveryAvailable ? 'Yes, I deliver' : 'No delivery'}</span>
                    </label>
                  </Field>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ─── STEP 3: Contact & Category ───────────────── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepCard title="Contact & Category" icon={<Phone size={18} className="text-festac-green" />}>
                <div className="space-y-4">
                  <Field label="Phone Number *">
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                      placeholder="0801 234 5678" className="input" />
                  </Field>

                  <Field label="WhatsApp Number" hint="Leave blank if same as phone">
                    <input type="tel" value={form.whatsappPhone} onChange={(e) => update('whatsappPhone', e.target.value)}
                      placeholder="0801 234 5678 (or leave blank)" className="input" />
                  </Field>

                  <Field label="Email Address">
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                      placeholder="business@email.com (optional)" className="input" />
                  </Field>

                  <Field label="Category *">
                    <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} className="input">
                      <option value="">Select your business category</option>
                      {(categories as any[])?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tags" hint="Comma-separated keywords to help customers find you">
                    <input type="text" value={form.tags} onChange={(e) => update('tags', e.target.value)}
                      placeholder="e.g. jollof rice, catering, delivery, festac" className="input" />
                  </Field>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* ─── STEP 4: Review ───────────────────────────── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <StepCard title="Review & Submit" icon={<CheckCircle size={18} className="text-festac-green" />}>
                <div className="space-y-3">
                  <ReviewRow label="Business Name" value={form.businessName} />
                  <ReviewRow label="Type" value={`${form.businessType} · ${form.priceRange.replace('_', ' ')}`} />
                  <ReviewRow label="Address" value={`${form.address}${form.ward ? `, ${form.ward}` : ''}, ${form.lga}`} />
                  <ReviewRow label="Phone" value={form.phone} />
                  {form.whatsappPhone && <ReviewRow label="WhatsApp" value={form.whatsappPhone} />}
                  <ReviewRow label="Delivery" value={form.deliveryAvailable ? 'Yes' : 'No'} />
                  <ReviewRow label="Description" value={form.description.slice(0, 80) + (form.description.length > 80 ? '...' : '')} />
                </div>

                <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium">📋 What happens next?</p>
                  <ul className="text-xs text-amber-600 mt-1 space-y-0.5 list-disc list-inside">
                    <li>Your listing will be reviewed within 24 hours</li>
                    <li>You'll receive an OTP confirmation on your phone</li>
                    <li>Once approved, you can add photos, products & services</li>
                    <li>Get verified to build more customer trust</li>
                  </ul>
                </div>
              </StepCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(s - 1, 1))} disabled={step === 1}
            icon={<ChevronLeft size={16} />}>
            Back
          </Button>

          {step < 4 ? (
            <Button variant="primary" onClick={handleNext} icon={<ChevronRight size={16} />} iconPosition="right">
              Continue
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={handleSubmit} loading={createVendor.isPending}
              icon={<CheckCircle size={16} />}>
              Submit Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="font-display font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium flex-shrink-0 w-28">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}
