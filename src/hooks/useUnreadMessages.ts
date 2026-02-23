import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadGroup, setUnreadGroup] = useState(0);
  const [unreadDMs, setUnreadDMs] = useState<Record<string, number>>({});
  const [lastSeenGroup, setLastSeenGroup] = useState<string>("");
  const [lastSeenDM, setLastSeenDM] = useState<Record<string, string>>({});

  // Load last-seen timestamps from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`lastSeenGroup_${user.id}`);
    if (stored) setLastSeenGroup(stored);
    const storedDM = localStorage.getItem(`lastSeenDM_${user.id}`);
    if (storedDM) setLastSeenDM(JSON.parse(storedDM));
  }, [user]);

  // Count unread group messages
  const fetchUnreadGroup = useCallback(async () => {
    if (!user || !lastSeenGroup) {
      // If never seen, count all as 0 (first visit)
      if (!lastSeenGroup && user) {
        markGroupSeen();
      }
      return;
    }
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .neq("user_id", user.id)
      .gt("created_at", lastSeenGroup);
    setUnreadGroup(count || 0);
  }, [user, lastSeenGroup]);

  // Count unread DMs per user
  const fetchUnreadDMs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("sender_id, created_at")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach((msg) => {
      const lastSeen = lastSeenDM[msg.sender_id] || "";
      if (msg.created_at > lastSeen) {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      }
    });
    setUnreadDMs(counts);
  }, [user, lastSeenDM]);

  useEffect(() => {
    fetchUnreadGroup();
    fetchUnreadDMs();
  }, [fetchUnreadGroup, fetchUnreadDMs]);

  // Subscribe to realtime
  useEffect(() => {
    if (!user) return;

    const groupChannel = supabase
      .channel("unread-group")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.user_id !== user.id) {
          setUnreadGroup((prev) => prev + 1);
        }
      })
      .subscribe();

    const dmChannel = supabase
      .channel("unread-dm")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id) {
          setUnreadDMs((prev) => ({
            ...prev,
            [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(dmChannel);
    };
  }, [user]);

  const markGroupSeen = useCallback(() => {
    if (!user) return;
    const now = new Date().toISOString();
    setLastSeenGroup(now);
    localStorage.setItem(`lastSeenGroup_${user.id}`, now);
    setUnreadGroup(0);
  }, [user]);

  const markDMSeen = useCallback((senderId: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    setLastSeenDM((prev) => {
      const updated = { ...prev, [senderId]: now };
      localStorage.setItem(`lastSeenDM_${user.id}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadDMs((prev) => {
      const updated = { ...prev };
      delete updated[senderId];
      return updated;
    });
  }, [user]);

  const totalUnread = unreadGroup + Object.values(unreadDMs).reduce((a, b) => a + b, 0);

  return { unreadGroup, unreadDMs, totalUnread, markGroupSeen, markDMSeen };
}