import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Lock,
  AlertCircle,
  Phone,
  Clock,
  Bot,
  User,
  RefreshCw,
  ChevronLeft,
  Activity,
  Users,
  Zap,
  Send,
  MoreVertical,
  X,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';
import { useChatbotSessions, useTakeoverSession, useResumeSession, useChatbotAnalytics } from '../../hooks/useChatbot';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import { ChatbotSessionStatus, ConversationState } from '../../lib/shared';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface SessionWithState {
  id: string;
  customerPhone: string;
  sessionStatus: ChatbotSessionStatus;
  currentState: ConversationState;
  botActive: boolean;
  humanTakeover: boolean;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  assignedOperatorId: string | null;
}

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const { data: sessions, isLoading, error, refetch } = useChatbotSessions();
  const { data: analytics } = useChatbotAnalytics('week');
  const takeoverSession = useTakeoverSession();
  const resumeSession = useResumeSession();
  
  const [selectedSession, setSelectedSession] = useState<SessionWithState | null>(null);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [operatorStatus, setOperatorStatus] = useState<'online' | 'offline'>('online');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Check if user is a vendor or super admin
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user?.vendorId) return undefined;

    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    const socketInstance = io(apiUrl, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join_vendor_room', user.vendorId);
      socketInstance.emit('operator_status', {
        vendorId: user.vendorId,
        operatorId: user.id,
        status: operatorStatus,
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('message_received', (data) => {
      refetch();
      if (selectedSession?.id === data.sessionId) {
        // Update selected session with new message
      }
    });

    socketInstance.on('session_state_changed', (data) => {
      refetch();
    });

    socketInstance.on('conversation_assigned', (data) => {
      toast.success('New conversation assigned to you');
      refetch();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.vendorId, user?.id]);

  // Update operator status
  useEffect(() => {
    if (socket && user?.vendorId) {
      socket.emit('operator_status', {
        vendorId: user.vendorId,
        operatorId: user.id,
        status: operatorStatus,
      });
    }
  }, [operatorStatus, socket, user?.vendorId, user?.id]);

  // Show access denied if not a vendor
  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <Lock size={48} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be a vendor to access Operator Dashboard.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Sessions</h1>
          <p className="text-gray-600 mb-6">Failed to load chat sessions. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const handleTakeover = (sessionId: string) => {
    takeoverSession.mutate(
      { sessionId, assignedOperatorId: user?.id },
      {
        onSuccess: () => {
          toast.success('Session taken over successfully');
          refetch();
          socket?.emit('operator_joined', {
            vendorId: user?.vendorId,
            sessionId,
            operatorId: user?.id,
          });
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
          socket?.emit('bot_resumed', {
            vendorId: user?.vendorId,
            sessionId,
          });
        },
        onError: () => {
          toast.error('Failed to resume bot');
        },
      }
    );
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedSession) return;
    // Implement message sending via Socket.IO or API
    setMessage('');
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

  const getStateColor = (state: ConversationState) => {
    switch (state) {
      case 'WELCOME': return 'blue';
      case 'MENU': return 'green';
      case 'FAQ_SEARCH': return 'purple';
      case 'PRODUCT_SEARCH': return 'amber';
      case 'SERVICE_SEARCH': return 'blue';
      case 'WAITING_FOR_OPERATOR': return 'amber';
      case 'HUMAN_CHAT': return 'red';
      case 'BOT_RESUMED': return 'blue';
      case 'CLOSED': return 'gray';
      default: return 'gray';
    }
  };

  const getStateLabel = (state: ConversationState) => {
    switch (state) {
      case 'WELCOME': return 'Welcome';
      case 'MENU': return 'Menu';
      case 'FAQ_SEARCH': return 'FAQ Search';
      case 'PRODUCT_SEARCH': return 'Product Search';
      case 'SERVICE_SEARCH': return 'Service Search';
      case 'WAITING_FOR_OPERATOR': return 'Waiting';
      case 'HUMAN_CHAT': return 'Human Chat';
      case 'BOT_RESUMED': return 'Bot Resumed';
      case 'CLOSED': return 'Closed';
      default: return state;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-hero text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const activeSessions = sessions?.filter((s) => s.sessionStatus === ChatbotSessionStatus.ACTIVE) || [];
  const takeoverSessions = sessions?.filter((s) => s.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER) || [];
  const waitingSessions = sessions?.filter((s) => s.currentState === ConversationState.WAITING_FOR_OPERATOR) || [];
  const myAssignedSessions = sessions?.filter((s) => s.assignedOperatorId === user?.id) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <ChevronLeft size={20} />
                </button>
              </Link>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl">Operator Dashboard</h1>
                <p className="text-white/60 text-xs sm:text-sm mt-1">{/*Real-time conversation management*/}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-xs sm:text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button
                onClick={() => setOperatorStatus(operatorStatus === 'online' ? 'offline' : 'online')}
                variant={operatorStatus === 'online' ? 'primary' : 'secondary'}
                size="sm"
              >
                {operatorStatus === 'online' ? 'Online' : 'Offline'}
              </Button>
              <Button
                onClick={() => refetch()}
                variant="primary"
                size="sm"
              >
                <RefreshCw size={18} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare size={18} className="text-blue-300 sm:size-20" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] sm:text-xs">Total Sessions</p>
                  <p className="text-white font-bold text-lg sm:text-xl">{sessions?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity size={18} className="text-green-300 sm:size-20" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] sm:text-xs">Active</p>
                  <p className="text-white font-bold text-lg sm:text-xl">{activeSessions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle size={18} className="text-amber-300 sm:size-20" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] sm:text-xs">Waiting</p>
                  <p className="text-white font-bold text-lg sm:text-xl">{waitingSessions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users size={18} className="text-purple-300 sm:size-20" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] sm:text-xs">Assigned</p>
                  <p className="text-white font-bold text-lg sm:text-xl">{myAssignedSessions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Sessions List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Active Conversations</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {!sessions || sessions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <MessageSquare size={48} className="text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">No Active Sessions</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Chat sessions will appear here when customers message you
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <Phone size={14} className="text-gray-500" />
                          <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">{session.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mb-1 sm:mb-2">
                          <Badge variant={getStateColor(session.currentState as ConversationState)}>
                            {getStateLabel(session.currentState as ConversationState)}
                          </Badge>
                          <Badge variant={
                            session.sessionStatus === ChatbotSessionStatus.ACTIVE ? 'green' :
                            session.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER ? 'amber' : 'gray'
                          }>
                            {session.sessionStatus === ChatbotSessionStatus.ACTIVE ? 'Active' :
                             session.sessionStatus === ChatbotSessionStatus.HUMAN_TAKEOVER ? 'Human' : 'Closed'}
                          </Badge>
                        </div>
                        {session.lastMessage && (
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate line-clamp-2">{session.lastMessage}</p>
                        )}
                        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{formatTime(session.lastMessageAt)}</span>
                        </div>
                      </div>
                      {session.assignedOperatorId === user?.id && (
                        <div className="p-1 bg-blue-100 rounded-full flex-shrink-0">
                          <CheckCircle size={14} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Phone size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedSession.customerPhone}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <Badge variant={getStateColor(selectedSession.currentState as ConversationState)}>
                          {getStateLabel(selectedSession.currentState as ConversationState)}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {formatDate(selectedSession.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {selectedSession.botActive && !selectedSession.humanTakeover ? (
                      <Button
                        onClick={() => handleTakeover(selectedSession.id)}
                        variant="danger"
                        size="sm"
                        disabled={takeoverSession.isPending}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <User size={14} className="mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">Take Over</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleResume(selectedSession.id)}
                        variant="primary"
                        size="sm"
                        disabled={resumeSession.isPending}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <Bot size={14} className="mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">Resume</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => setSelectedSession(null)}
                      variant="secondary"
                      size="sm"
                      className="p-1.5 sm:p-2"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-3 sm:space-y-4">
                    {selectedSession.lastMessage && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] sm:max-w-[70%] bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                          <p className="text-xs sm:text-sm text-gray-800">{selectedSession.lastMessage}</p>
                          <span className="text-[10px] sm:text-xs text-gray-400 mt-1 block">
                            {formatTime(selectedSession.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Add more message history here */}
                  </div>
                </div>

                {/* Message Input */}
                {selectedSession.humanTakeover && (
                  <div className="p-3 sm:p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        variant="primary"
                        className="p-2 sm:px-4"
                      >
                        <Send size={16} className="sm:p-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="text-center">
                  <MessageSquare size={48} className="text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Select a Conversation</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Choose a conversation from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
