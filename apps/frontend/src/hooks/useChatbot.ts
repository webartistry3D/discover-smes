import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotApi } from '../lib/api';
import type {
  ChatbotSettings,
  ChatbotRule,
  ChatbotSession,
  UpdateChatbotSettingsRequest,
  CreateChatbotRuleRequest,
  UpdateChatbotRuleRequest,
  TakeoverSessionRequest,
  ResumeSessionRequest,
  ProcessMessageRequest,
  ProcessMessageResponse,
} from '../lib/shared';

// ─── QUERY KEYS ─────────────────────────────────────────────

export const chatbotQueryKeys = {
  settings: ['chatbot', 'settings'] as const,
  rules: ['chatbot', 'rules'] as const,
  sessions: ['chatbot', 'sessions'] as const,
  analytics: ['chatbot', 'analytics'] as const,
};

// ─── CHATBOT SETTINGS ─────────────────────────────────────────

export function useChatbotSettings() {
  return useQuery({
    queryKey: chatbotQueryKeys.settings,
    queryFn: () => chatbotApi.getSettings().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useUpdateChatbotSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatbotSettingsRequest) =>
      chatbotApi.updateSettings(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.settings });
    },
  });
}

// ─── CHATBOT RULES ────────────────────────────────────────────

export function useChatbotRules(enabled = true) {
  return useQuery({
    queryKey: chatbotQueryKeys.rules,
    queryFn: () => chatbotApi.getRules().then((r) => r.data.data),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCreateChatbotRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatbotRuleRequest) =>
      chatbotApi.createRule(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.rules });
    },
  });
}

export function useUpdateChatbotRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotRuleRequest }) =>
      chatbotApi.updateRule(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.rules });
    },
  });
}

export function useDeleteChatbotRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatbotApi.deleteRule(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.rules });
    },
  });
}

// ─── CHATBOT SESSIONS ─────────────────────────────────────────

export function useChatbotSessions() {
  return useQuery({
    queryKey: chatbotQueryKeys.sessions,
    queryFn: () => chatbotApi.getSessions().then((r) => r.data.data),
    staleTime: 30 * 1000, // 30 sec
    refetchInterval: 30 * 1000, // Auto-refresh every 30 sec
  });
}

export function useTakeoverSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TakeoverSessionRequest) =>
      chatbotApi.takeoverSession(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.sessions });
    },
  });
}

export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResumeSessionRequest) =>
      chatbotApi.resumeSession(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotQueryKeys.sessions });
    },
  });
}

// ─── MESSAGE PROCESSING ───────────────────────────────────────

export function useProcessMessage() {
  return useMutation({
    mutationFn: (data: ProcessMessageRequest) =>
      chatbotApi.processMessage(data).then((r) => r.data.data),
  });
}

// ─── ANALYTICS ───────────────────────────────────────────────

export function useChatbotAnalytics(period: string = 'all') {
  return useQuery({
    queryKey: [...chatbotQueryKeys.analytics, period],
    queryFn: () => chatbotApi.getAnalytics(period).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
