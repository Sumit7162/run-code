import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  user_id: string;
  username: string;
  avatar_emoji: string;
}

interface UsersSidebarProps {
  onSelectUser: (userId: string, username: string, avatar: string) => void;
  selectedUserId: string | null;
  unreadDMs?: Record<string, number>;
}

export default function UsersSidebar({ onSelectUser, selectedUserId, unreadDMs = {} }: UsersSidebarProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_emoji")
        .order("username", { ascending: true });
      if (data) setUsers(data);
    };
    fetchUsers();

    const channel = supabase
      .channel("profiles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchUsers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const otherUsers = users.filter((u) => u.user_id !== user?.id);

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">
          All Users ({users.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {otherUsers.length === 0 && (
          <p className="text-xs text-muted-foreground font-mono text-center py-4">No other users yet</p>
        )}
        {otherUsers.map((u) => {
          const unread = unreadDMs[u.user_id] || 0;
          return (
            <motion.button
              key={u.user_id}
              whileHover={{ x: 4 }}
              onClick={() => onSelectUser(u.user_id, u.username, u.avatar_emoji)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedUserId === u.user_id
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-secondary/60"
              }`}
            >
              <span className="text-xl">{u.avatar_emoji}</span>
              <span className="text-sm font-mono text-foreground truncate flex-1">{u.username}</span>
              {unread > 0 ? (
                <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : (
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}