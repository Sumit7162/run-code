import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Code, Users, Copy, Check, Edit3 } from "lucide-react";

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  code?: { language: string; content: string };
  timestamp: Date;
  isEditing?: boolean;
}

const AVATARS = ["🧑‍💻", "👩‍💻", "🤖", "👨‍🔬", "👩‍🔬"];
const USERS = ["Alice", "Bob", "Charlie", "Diana", "Eve"];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    user: "Alice",
    avatar: "🧑‍💻",
    text: "Hey everyone! Check out this sorting algorithm:",
    code: {
      language: "python",
      content: `def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)`,
    },
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    user: "Bob",
    avatar: "👩‍💻",
    text: "Nice! Here's the C++ version:",
    code: {
      language: "cpp",
      content: `void quicksort(vector<int>& arr, int lo, int hi) {\n    if (lo >= hi) return;\n    int pivot = arr[(lo + hi) / 2];\n    int i = lo, j = hi;\n    while (i <= j) {\n        while (arr[i] < pivot) i++;\n        while (arr[j] > pivot) j--;\n        if (i <= j) swap(arr[i++], arr[j--]);\n    }\n    quicksort(arr, lo, j);\n    quicksort(arr, i, hi);\n}`,
    },
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    user: "Charlie",
    avatar: "🤖",
    text: "Both look great! The Python version is more readable but C++ will be faster for large arrays. 🚀",
    timestamp: new Date(Date.now() - 180000),
  },
];

export default function GroupChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLang, setCodeLang] = useState("python");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() && !codeInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      avatar: "👨‍🔬",
      text: input,
      timestamp: new Date(),
    };
    if (codeMode && codeInput.trim()) {
      newMsg.code = { language: codeLang, content: codeInput };
    }
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setCodeInput("");
    setCodeMode(false);

    // Simulate reply
    setTimeout(() => {
      const responder = Math.floor(Math.random() * 3);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          user: USERS[responder],
          avatar: AVATARS[responder],
          text: [
            "Interesting approach! Have you benchmarked it?",
            "That looks clean 👏 Nice work!",
            "I'd suggest adding error handling there.",
          ][responder],
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  const handleCopyCode = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (msg: ChatMessage) => {
    if (msg.code) {
      setEditingId(msg.id);
      setEditContent(msg.code.content);
    }
  };

  const saveEdit = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.code ? { ...m, code: { ...m.code, content: editContent } } : m
      )
    );
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Group Chat</h2>
        </div>
        <div className="flex items-center gap-1">
          {AVATARS.slice(0, 3).map((a, i) => (
            <span key={i} className="text-lg -ml-1 first:ml-0">
              {a}
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">+2</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.user === "You" ? "flex-row-reverse" : ""}`}
            >
              <span className="text-2xl flex-shrink-0 mt-1">{msg.avatar}</span>
              <div
                className={`max-w-[80%] ${
                  msg.user === "You" ? "items-end" : "items-start"
                } flex flex-col gap-1`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary">{msg.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {msg.text && (
                  <p className="text-sm text-foreground bg-secondary/60 rounded-lg px-3 py-2">
                    {msg.text}
                  </p>
                )}
                {msg.code && (
                  <div className="code-block-chat w-full mt-1">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-chat-code-border bg-secondary/30 rounded-t-lg">
                      <span className="text-xs font-mono text-primary">{msg.code.language}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(msg)}
                          className="p-1 text-muted-foreground hover:text-code-accent transition-colors"
                          title="Edit code"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyCode(msg.id, msg.code!.content)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Copy code"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
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
                          <button
                            onClick={() => saveEdit(msg.id)}
                            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded font-mono"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="p-3 text-xs font-mono text-accent overflow-x-auto">
                        {msg.code.content}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Code attachment */}
      <AnimatePresence>
        {codeMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30">
              <Code className="w-4 h-4 text-primary" />
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="bg-secondary text-foreground text-xs font-mono rounded px-2 py-1 border border-border"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
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
            className={`p-2 rounded-md transition-colors ${
              codeMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-secondary"
            }`}
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
          <button
            onClick={sendMessage}
            className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity glow-primary"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
