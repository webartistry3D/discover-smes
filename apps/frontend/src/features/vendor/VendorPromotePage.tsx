import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, TrendingUp, Zap, Crown, Rocket, CheckCircle, Star } from 'lucide-react';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { usePromotions, useCreatePromotion } from '../../hooks/useVendors';
import toast from 'react-hot-toast';

type PromotionPlan = 'BASIC' | 'PRO' | 'PREMIUM';

export default function VendorPromotePage() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-festac-green to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-3xl">Boost Your Listing</h1>
              <p className="text-white/80">Reach more customers with promoted listings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Current Promotion Status */}
        <div className="bg-white rounded-2xl p-6 shadow-card mb-8">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-festac-green" />
            Current Promotion Status
          </h2>
          {promotionsLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : promotions && promotions.length > 0 ? (
            <div className="space-y-3">
              {promotions.map((promo: any) => (
                <div key={promo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900">{promo.planType} Boost</p>
                    <p className="text-sm text-gray-500">
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
                <p className="font-bold text-gray-900">No active promotion</p>
                <p className="text-sm text-gray-500">Boost your listing to get more visibility</p>
              </div>
              <Button variant="secondary">View History</Button>
            </div>
          )}
        </div>

        {/* Promotion Plans */}
        <h2 className="font-semibold text-gray-900 mb-4">Choose Your Boost Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-card overflow-hidden ${
                selectedPlan === plan.key ? 'ring-2 ring-festac-green' : ''
              } ${plan.popular ? 'transform scale-105' : ''}`}
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
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
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
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-festac-green" />
            Why Boost Your Listing?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <TrendingUp size={24} />, title: 'Increased Visibility', desc: 'Get seen by more customers' },
              { icon: <Zap size={24} />, title: 'Faster Results', desc: 'See results in days, not weeks' },
              { icon: <Crown size={24} />, title: 'Premium Placement', desc: 'Top spots in search results' },
              { icon: <Rocket size={24} />, title: 'More Bookings', desc: 'Convert more visitors to customers' },
            ].map((benefit, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="p-3 bg-festac-green/10 rounded-xl text-festac-green mb-3 inline-block">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-500">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
