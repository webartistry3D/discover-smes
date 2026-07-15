import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  MessageSquare,
  Lock,
  AlertCircle,
  Phone,
  Clock,
  Bot,
  User,
  ChevronLeft,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import { useChatbotSessions, useTakeoverSession, useResumeSession } from '../../hooks/useChatbot';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { ChatbotSessionStatus } from '../../lib/shared';
import toast from 'react-hot-toast';

export default function ChatMonitor() {
  const { isDarkMode } = useUIStore();
  const { user } = useAuthStore();
  const { data: sessions, isLoading, error, refetch } = useChatbotSessions();
  const takeoverSession = useTakeoverSession();
  const resumeSession = useResumeSession();

  // Check if user is a vendor or super admin
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';

  // Show access denied if not a vendor
  if (!isVendor) {
    return (
      <div className={clsx('min-h-screen flex items-center justify-center', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center">
          <div className={clsx('p-4 rounded-full inline-flex mb-4', isDarkMode ? 'bg-gray-800' : 'bg-gray-100')}>
            <Lock size={48} className="text-gray-400" />
          </div>
          <h1 className={clsx('text-2xl font-bold mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>Access Denied</h1>
          <p className={clsx('mb-6', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>You need to be a vendor to access Chat Monitor.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={clsx('min-h-screen flex items-center justify-center', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className={clsx('text-2xl font-bold mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>Error Loading Sessions</h1>
          <p className={clsx('mb-6', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Failed to load chat sessions. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const handleTakeover = (sessionId: string) => {
    takeoverSession.mutate(
      { sessionId },
      {
        onSuccess: () => {
          toast.success('Session taken over successfully');
          refetch();
        },
        onError: () => {
          toast.error('Failed to take over session');
        },
      }
    );
  };

  const handleResume = (sessionId: string) => {
    resumeSession.mutate(
      { sessionId },
      {
        onSuccess: () => {
          toast.success('Bot resumed successfully');
          refetch();
        },
        onError: () => {
          toast.error('Failed to resume bot');
        },
      }
    );
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className={clsx('rounded-b-2xl shadow-sm', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const activeSessions = sessions?.filter((s) => s.sessionStatus === ChatbotSessionStatus.ACTIVE) || [];
  const takeoverSessions = sessions?.filter((s) => s.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER) || [];
  const botActiveSessions = sessions?.filter((s) => s.botActive) || [];

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
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
              <h1 className="font-display font-bold text-2xl">Chat Monitor</h1>
            </div>
            {/* Manual refresh removed — sessions auto-refresh every 30s */}
            {/*
            <Button
              onClick={() => refetch()}
              variant="primary"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </Button>
            */}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageSquare size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Sessions</p>
                </div>
                <p className={clsx('font-bold text-3xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{sessions?.length || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Activity size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Active</p>
                </div>
                <p className={clsx('font-bold text-3xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{activeSessions.length}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap size={20} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Bot Active</p>
                </div>
                <p className={clsx('font-bold text-3xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{botActiveSessions.length}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Sessions List */}
        <div className="space-y-3">
          {!sessions || sessions.length === 0 ? (
            <div className={clsx('rounded-xl shadow-sm p-12 border text-center', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <MessageSquare size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <h3 className={clsx('font-semibold mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>No Active Sessions</h3>
              <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                Chat sessions will appear here when customers message you
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('rounded-xl shadow-sm p-4 border', session.humanTakeover ? 'bg-amber-50 border-amber-200' : '', isDarkMode ? session.humanTakeover ? 'bg-amber-900/20 border-amber-800' : 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                        <span className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{session.customerPhone}</span>
                      </div>
                      <Badge variant={
                        session.sessionStatus === ChatbotSessionStatus.ACTIVE ? 'green' :
                        session.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER ? 'amber' : 'gray'
                      }>
                        {session.sessionStatus === ChatbotSessionStatus.ACTIVE ? 'Active' :
                         session.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER ? 'Human Takeover' : 'Closed'}
                      </Badge>
                      {session.botActive ? (
                        <Badge variant="blue" className="flex items-center gap-1">
                          <Bot size={12} />
                          Bot Active
                        </Badge>
                      ) : (
                        <Badge variant="amber" className="flex items-center gap-1">
                          <User size={12} />
                          Human Control
                        </Badge>
                      )}
                    </div>
                    
                    {session.lastMessage && (
                      <div className={clsx('mb-3 p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                        <p className={clsx('text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{session.lastMessage}</p>
                      </div>
                    )}
                    
                    <div className={clsx('flex items-center gap-4 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Last: {formatTime(session.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {session.botActive && !session.humanTakeover ? (
                      <Button
                        onClick={() => handleTakeover(session.id)}
                        variant="danger"
                        size="sm"
                        disabled={takeoverSession.isPending}
                        className="flex items-center gap-1"
                      >
                        <User size={14} />
                        Take Over
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleResume(session.id)}
                        variant="primary"
                        size="sm"
                        disabled={resumeSession.isPending}
                        className="flex items-center gap-1"
                      >
                        <Bot size={14} />
                        Resume Bot
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
