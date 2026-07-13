/**
 * Real-time notifications hook with Supabase subscriptions
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Notification, NotificationType } from '@/lib/types';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: payload.new.type as NotificationType,
            message: payload.new.message,
            duration: 5000,
          };
          setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, removeNotification };
}
