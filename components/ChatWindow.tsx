'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group, Message } from '@/lib/supabase/types';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface ChatWindowProps {
  group: Group;
  onBack: () => void;
}

export default function ChatWindow({ group, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${group.id}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${group.id}`,
        },
        (payload: RealtimePostgresInsertPayload<Message>) => {
          const newMsg = payload.new;
          fetchMessageWithSender(newMsg.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageWithSender = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: group.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  let lastDate = '';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition"
        >
          <svg
            className="w-6 h-6 text-zinc-900 dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center">
          <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
            {group.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 dark:text-zinc-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const messageDate = formatDate(message.created_at);
            const showDateDivider = messageDate !== lastDate;
            lastDate = messageDate;
            const isOwnMessage = message.sender_id === user?.id;

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {messageDate}
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md ${
                      isOwnMessage
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    } rounded-lg px-4 py-2 shadow-sm`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        {message.sender?.username}
                      </p>
                    )}
                    <p className="break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage
                          ? 'text-zinc-300 dark:text-zinc-600'
                          : 'text-zinc-500 dark:text-zinc-500'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}