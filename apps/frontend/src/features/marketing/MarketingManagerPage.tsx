import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Megaphone, 
  Gift, 
  MessageSquare, 
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  TrendingUp,
  Send,
  Check,
  X,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { 
  usePromotions, 
  useCreatePromotion, 
  useUpdatePromotion, 
  useDeletePromotion,
  useLoyaltyPrograms,
  useCreateLoyaltyProgram,
  useUpdateLoyaltyProgram,
  useDeleteLoyaltyProgram,
  useWhatsAppCampaigns,
  useCreateWhatsAppCampaign,
  useUpdateWhatsAppCampaign,
  useDeleteWhatsAppCampaign,
  useSendWhatsAppCampaign
} from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function MarketingManagerPage() {
  const { isDarkMode } = useUIStore();
  const { user } = useAuthStore();
  const { data: promotions, isLoading: promotionsLoading } = usePromotions();
  const { data: loyaltyPrograms, isLoading: loyaltyLoading } = useLoyaltyPrograms();
  const { data: campaigns, isLoading: campaignsLoading } = useWhatsAppCampaigns();
  
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  
  const createLoyaltyProgram = useCreateLoyaltyProgram();
  const updateLoyaltyProgram = useUpdateLoyaltyProgram();
  const deleteLoyaltyProgram = useDeleteLoyaltyProgram();
  
  const createCampaign = useCreateWhatsAppCampaign();
  const updateCampaign = useUpdateWhatsAppCampaign();
  const deleteCampaign = useDeleteWhatsAppCampaign();
  const sendCampaign = useSendWhatsAppCampaign();

  const [activeTab, setActiveTab] = useState<'promotions' | 'loyalty' | 'whatsapp'>('promotions');
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [isAddingLoyalty, setIsAddingLoyalty] = useState(false);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);

  // Check if user is a vendor or super admin
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';

  // Show access denied if not a vendor
  if (!isVendor) {
    return (
      <div className={clsx('min-h-screen flex items-center justify-center', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <Lock size={48} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be a vendor to access Marketing Tools.</p>
          <Link href="/dashboard">
            <Button variant="primary">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen pb-20 overflow-x-hidden', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Marketing Tools</h1>
              {/*<p className="text-white/60 text-sm mt-1">Manage promotions, loyalty programs, and WhatsApp campaigns</p>*/}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur rounded-xl p-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Megaphone size={20} className="text-blue-300" />
                  </div>
                  <p className="text-white/60 text-xs">Active Promotions</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{promotions?.length || 0}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur rounded-xl p-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Gift size={20} className="text-purple-300" />
                  </div>
                  <p className="text-white/60 text-xs">Loyalty Programs</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{loyaltyPrograms?.length || 0}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur rounded-xl p-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <MessageSquare size={20} className="text-green-300" />
                  </div>
                  <p className="text-white/60 text-xs">WhatsApp Campaigns</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{campaigns?.length || 0}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className={clsx('flex gap-2 rounded-lg p-2 shadow-sm border overflow-x-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'promotions'
                ? 'bg-festac-green text-white'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Promotions
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'loyalty'
                ? 'bg-festac-green text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Loyalty Programs
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-festac-green text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            WhatsApp Campaigns
          </button>
        </div>

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className={clsx('font-semibold text-lg flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                <Megaphone size={20} className="text-blue-500" />
                Promotions & Discounts
              </h2>
              <Button onClick={() => setIsAddingPromotion(true)} variant="primary" size="sm">
                <Plus size={16} className="mr-2" />
                Add Promotion
              </Button>
            </div>

            {promotionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : promotions && promotions.length > 0 ? (
              <div className="space-y-3">
                {promotions.map((promo: any) => (
                  <div key={promo.id} className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className={clsx('font-medium text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-800')}>{promo.title}</h4>
                          {promo.discount && (
                            <Badge variant="green">{promo.discount}% OFF</Badge>
                          )}
                          {!promo.isActive && (
                            <Badge variant="gray">Inactive</Badge>
                          )}
                        </div>
                        {promo.description && (
                          <p className={clsx('text-sm mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{promo.description}</p>
                        )}
                        <div className={clsx('flex flex-wrap items-center gap-4 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this promotion?')) {
                              deletePromotion.mutate(promo.id, {
                                onSuccess: () => toast.success('Promotion deleted'),
                                onError: () => toast.error('Failed to delete promotion')
                              });
                            }
                          }}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Megaphone size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No promotions yet. Create your first promotion to get started.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Loyalty Programs Tab */}
        {activeTab === 'loyalty' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className={clsx('font-semibold text-lg flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                <Gift size={20} className="text-purple-500" />
                Loyalty Programs
              </h2>
              <Button onClick={() => setIsAddingLoyalty(true)} variant="primary" size="sm">
                <Plus size={16} className="mr-2" />
                Add Program
              </Button>
            </div>

            {loyaltyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : loyaltyPrograms && loyaltyPrograms.length > 0 ? (
              <div className="space-y-3">
                {loyaltyPrograms.map((program: any) => (
                  <div key={program.id} className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className={clsx('font-medium text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-800')}>{program.name}</h4>
                          {!program.isActive && (
                            <Badge variant="gray">Inactive</Badge>
                          )}
                        </div>
                        {program.description && (
                          <p className={clsx('text-sm mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{program.description}</p>
                        )}
                        <div className={clsx('flex flex-wrap items-center gap-4 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            <span className="font-mono">{program.pointsPerNaira}</span> points per ₦1
                          </span>
                          <span className="flex items-center gap-1">
                            <Gift size={12} />
                            Redeem at {program.redemptionRate} points
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this loyalty program?')) {
                              deleteLoyaltyProgram.mutate(program.id, {
                                onSuccess: () => toast.success('Loyalty program deleted'),
                                onError: () => toast.error('Failed to delete loyalty program')
                              });
                            }
                          }}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No loyalty programs yet. Create your first program to reward customers.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* WhatsApp Campaigns Tab */}
        {activeTab === 'whatsapp' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className={clsx('font-semibold text-lg flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                <MessageSquare size={20} className="text-green-500" />
                WhatsApp Campaigns
              </h2>
              <Button onClick={() => setIsAddingCampaign(true)} variant="primary" size="sm">
                <Plus size={16} className="mr-2" />
                Create Campaign
              </Button>
            </div>

            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign: any) => (
                  <div key={campaign.id} className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className={clsx('font-medium text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-800')}>{campaign.name}</h4>
                          <Badge variant={
                            campaign.status === 'SENT' ? 'green' :
                            campaign.status === 'SCHEDULED' ? 'amber' :
                            campaign.status === 'FAILED' ? 'red' : 'gray'
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {campaign.recipientCount} recipients
                          </span>
                          {campaign.sentAt && (
                            <span className="flex items-center gap-1">
                              <Send size={12} />
                              Sent {new Date(campaign.sentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-green-600 flex items-center gap-1">
                            <Check size={12} />
                            {campaign.deliveredCount} delivered
                          </span>
                          <span className="text-blue-600 flex items-center gap-1">
                            <MessageSquare size={12} />
                            {campaign.readCount} read
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'DRAFT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              sendCampaign.mutate(campaign.id, {
                                onSuccess: () => toast.success('Campaign sent'),
                                onError: () => toast.error('Failed to send campaign')
                              });
                            }}
                          >
                            <Send size={14} />
                          </Button>
                        )}
                        <Button variant="secondary" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this campaign?')) {
                              deleteCampaign.mutate(campaign.id, {
                                onSuccess: () => toast.success('Campaign deleted'),
                                onError: () => toast.error('Failed to delete campaign')
                              });
                            }
                          }}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No WhatsApp campaigns yet. Create your first campaign to reach customers.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
