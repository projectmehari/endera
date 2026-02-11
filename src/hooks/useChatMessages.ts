import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

export function useChatMessages() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as ChatMessage[]).reverse();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          queryClient.setQueryData<ChatMessage[]>(["chat-messages"], (old = []) => {
            if (old.some((m) => m.id === newMsg.id)) return old;
            return [...old, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const sendMessage = useCallback(
    async (username: string, message: string) => {
      const { error } = await supabase
        .from("chat_messages")
        .insert({ username, message: message.slice(0, 280) });
      if (error) throw error;
    },
    []
  );

  return { messages, isLoading, sendMessage };
}
