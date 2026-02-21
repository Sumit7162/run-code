import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Code, Users, Copy, Check, Edit3, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  text: string | null;
  code_content: string | null;
  code_language: string | null;
  created_at: string;
  profiles?: { username: string; avatar_emoji: string };
}

export default function GroupChat() {
  const { user, profile, signOut } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLang, setCodeLang] = useState("python");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, profiles!messages_profile_user_id_fkey(username, avatar_emoji)")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as any);
    };
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async () => {
          // Refetch all on any change
          const { data } = await supabase
            .from("messages")
            .select("*, profiles!messages_profile_user_id_fkey(username, avatar_emoji)")
            .order("created_at", { ascending: true })
            .limit(100);
          if (data) setMessages(data as any);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !codeInput.trim()) return;
    if (!user) return;

    await supabase.from("messages").insert({
      user_id: user.id,
      text: input || null,
      code_content: codeMode && codeInput.trim() ? codeInput : null,
      code_language: codeMode && codeInput.trim() ? codeLang : null,
    });

    setInput("");
    setCodeInput("");
    setCodeMode(false);
  };

  const handleCopyCode = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (msg: ChatMessage) => {
    if (msg.code_content && msg.user_id === user?.id) {
      setEditingId(msg.id);
      setEditContent(msg.code_content);
    }
  };

  const saveEdit = async (id: string) => {
    await supabase.from("messages").update({ code_content: editContent }).eq("id", id);
    setEditingId(null);
    setEditContent("");
  };

  const getProfile = (msg: ChatMessage) => {
    const p = msg.profiles as any;
    return {
      username: p?.username || "Unknown",
      avatar: p?.avatar_emoji || "🧑‍💻",
    };
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Group Chat</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-primary">
            {profile?.avatar_emoji} {profile?.username}
          </span>
          <button onClick={signOut} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm font-mono py-8">
            No messages yet. Start the conversation! 🚀
          </p>
        )}
        <AnimatePresence>
          {messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            const { username, avatar } = getProfile(msg);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <span className="text-2xl flex-shrink-0 mt-1">{avatar}</span>
                <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary">{username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {msg.text && (
                    <p className="text-sm text-foreground bg-secondary/60 rounded-lg px-3 py-2">{msg.text}</p>
                  )}
                  {msg.code_content && (
                    <div className="code-block-chat w-full mt-1">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-chat-code-border bg-secondary/30 rounded-t-lg">
                        <span className="text-xs font-mono text-primary">{msg.code_language}</span>
                        <div className="flex gap-1">
                          {isOwn && (
                            <button onClick={() => startEdit(msg)} className="p-1 text-muted-foreground hover:text-code-accent transition-colors" title="Edit code">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleCopyCode(msg.id, msg.code_content!)} className="p-1 text-muted-foreground hover:text-primary transition-colors" title="Copy code">
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {editingId === msg.id ? (
                        <div className="p-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-code-bg text-accent font-mono text-xs p-2 rounded border border-border focus:border-primary outline-none resize-none"
                            rows={6}
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => saveEdit(msg.id)} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded font-mono">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded font-mono">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <pre className="p-3 text-xs font-mono text-accent overflow-x-auto">{msg.code_content}</pre>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Code attachment */}
      <AnimatePresence>
        {codeMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-foreground">C++</span>
            </div>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full bg-code-bg text-accent font-mono text-sm p-4 resize-none outline-none"
              rows={4}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCodeMode(!codeMode)}
            className={`p-2 rounded-md transition-colors ${codeMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-secondary"}`}
            title="Attach code"
          >
            <Code className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-2.5 text-sm font-body outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={sendMessage} className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity glow-primary">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
