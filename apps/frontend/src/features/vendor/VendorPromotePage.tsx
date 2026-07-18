import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, TrendingUp, Zap, Crown, Rocket, CheckCircle, Star } from 'lucide-react';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { usePromotions, useCreatePromotion } from '../../hooks/useVendors';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

type PromotionPlan = 'BASIC' | 'PRO' | 'PREMIUM';

export default function VendorPromotePage() {
  const { isDarkMode } = useUIStore();
  const [selectedPlan, setSelectedPlan] = useState<PromotionPlan>('PRO');
  const { data: promotions, isLoading: promotionsLoading } = usePromotions();
  const createPromotion = useCreatePromotion();

  const plans = [
    {
      key: 'BASIC' as PromotionPlan,
      name: 'Basic Boost',
      price: '₦5,000',
      duration: '7 days',
      icon: <Zap size={32} />,
      color: 'from-blue-500 to-blue-600',
      features: [
        '2x profile visibility',
        'Featured in search results',
        'Priority in category listings',
        'Basic analytics',
      ],
      popular: false,
    },
    {
      key: 'PRO' as PromotionPlan,
      name: 'Pro Boost',
      price: '₦15,000',
      duration: '30 days',
      icon: <TrendingUp size={32} />,
      color: 'from-purple-500 to-purple-600',
      features: [
        '3x profile visibility',
        'Featured on homepage',
        'Top of search results',
        'Advanced analytics',
        'Social media promotion',
      ],
      popular: true,
    },
    {
      key: 'PREMIUM' as PromotionPlan,
      name: 'Premium Boost',
      price: '₦35,000',
      duration: '60 days',
      icon: <Crown size={32} />,
      color: 'from-amber-500 to-amber-600',
      features: [
        '5x profile visibility',
        'Premium featured placement',
        'Top of all listings',
        'Full analytics suite',
        'Social media promotion',
        'Email campaign to users',
        'Dedicated account manager',
      ],
      popular: false,
    },
  ];

  const handlePurchase = async (plan: PromotionPlan) => {
    createPromotion.mutate(
      { planType: plan },
      {
        onSuccess: () => toast.success('Boost activated successfully!'),
        onError: () => toast.error('Failed to activate boost'),
      }
    );
  };

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Boost Your Listing</h1>
              {/*<p className="text-white/60 text-sm mt-1">Reach more customers with promoted listings</p>*/}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Current Promotion Status */}
        <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-8', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
            <Rocket className={clsx('w-5 h-5 text-festac-green')} />
            Current Promotion Status
          </h2>
          {promotionsLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : promotions && promotions.length > 0 ? (
            <div className="space-y-3">
              {promotions.map((promo: any) => (
                <div key={promo.id} className={clsx('flex items-center justify-between p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                  <div>
                    <p className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{promo.planType} Boost</p>
                    <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      Active until {new Date(promo.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="green">Active</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>No active promotion</p>
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Boost your listing to get more visibility</p>
              </div>
              <Button variant="secondary">View History</Button>
            </div>
          )}
        </div>

        {/* Promotion Plans */}
        <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Choose Your Boost Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={clsx('relative rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white',
                selectedPlan === plan.key ? 'ring-2 ring-festac-green' : ''
              , plan.popular ? 'transform scale-105' : '')}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-festac-green text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  MOST POPULAR
                </div>
              )}
              <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                <div className="flex justify-between items-start mb-4">
                  {plan.icon}
                  <div className="text-right">
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <p className="text-sm opacity-80">{plan.duration}</p>
                  </div>
                </div>
                <h3 className="font-bold text-xl">{plan.name}</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={clsx('flex items-center gap-2 text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    setSelectedPlan(plan.key);
                    handlePurchase(plan.key);
                  }}
                  disabled={createPromotion.isPending}
                  variant={selectedPlan === plan.key ? 'primary' : 'secondary'}
                  className="w-full"
                >
                  {createPromotion.isPending ? 'Processing...' : selectedPlan === plan.key ? 'Selected' : 'Select Plan'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
            <Star className={clsx('w-5 h-5 text-festac-green')} />
            Why Boost Your Listing?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <TrendingUp size={24} />, title: 'Increased Visibility', desc: 'Get seen by more customers' },
              { icon: <Zap size={24} />, title: 'Faster Results', desc: 'See results in days, not weeks' },
              { icon: <Crown size={24} />, title: 'Premium Placement', desc: 'Top spots in search results' },
              { icon: <Rocket size={24} />, title: 'More Bookings', desc: 'Convert more visitors to customers' },
            ].map((benefit, index) => (
              <div key={index} className={clsx('p-4 rounded-xl', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                <div className="p-3 bg-festac-green/10 rounded-xl text-festac-green mb-3 inline-block">
                  {benefit.icon}
                </div>
                <h3 className={clsx('font-semibold mb-1', isDarkMode ? 'text-white' : 'text-gray-900')}>{benefit.title}</h3>
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
