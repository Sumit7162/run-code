import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Code, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DMMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string | null;
  code_content: string | null;
  code_language: string | null;
  created_at: string;
}

interface DirectChatProps {
  targetUserId: string;
  targetUsername: string;
  targetAvatar: string;
  onBack: () => void;
}

export default function DirectChat({ targetUserId, targetUsername, targetAvatar, onBack }: DirectChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`dm-${targetUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, fetchMessages)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [targetUserId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !codeInput.trim()) return;
    if (!user) return;

    await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: targetUserId,
      text: input || null,
      code_content: codeMode && codeInput.trim() ? codeInput : null,
      code_language: codeMode && codeInput.trim() ? "cpp" : null,
    });

    setInput("");
    setCodeInput("");
    setCodeMode(false);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xl">{targetAvatar}</span>
        <h2 className="font-display font-semibold text-foreground">{targetUsername}</h2>
        <span className="text-xs text-muted-foreground font-mono">Direct Message</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm font-mono py-8">
            Start a conversation with {targetUsername}! 💬
          </p>
        )}
        <AnimatePresence>
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <span className="text-2xl flex-shrink-0 mt-1">
                  {isOwn ? profile?.avatar_emoji : targetAvatar}
                </span>
                <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.text && (
                    <p className="text-sm text-foreground bg-secondary/60 rounded-lg px-3 py-2">{msg.text}</p>
                  )}
                  {msg.code_content && (
                    <div className="code-block-chat w-full mt-1">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-chat-code-border bg-secondary/30 rounded-t-lg">
                        <span className="text-xs font-mono text-primary">{msg.code_language}</span>
                        <button onClick={() => handleCopy(msg.id, msg.code_content!)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="p-3 text-xs font-mono text-accent overflow-x-auto">{msg.code_content}</pre>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Code mode */}
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
          >
            <Code className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${targetUsername}...`}
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
