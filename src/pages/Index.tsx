import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, MessageSquare, Zap, LogOut } from "lucide-react";
import ParticleScene from "@/components/ParticleScene";
import CodeEditor from "@/components/CodeEditor";
import GroupChat from "@/components/GroupChat";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type View = "editor" | "chat";

const Index = () => {
  const [view, setView] = useState<View>("editor");
  const { user, loading, profile, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Zap className="w-8 h-8 text-primary animate-pulse-glow" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen relative">
      <ParticleScene />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border glass">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary animate-pulse-glow" />
          <h1 className="font-display font-bold text-xl text-foreground glow-text">CodeForge</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setView("editor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono transition-all ${
                view === "editor" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code Runner
            </button>
            <button
              onClick={() => setView("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono transition-all ${
                view === "chat" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Group Chat
            </button>
          </nav>
          <span className="text-sm font-mono text-muted-foreground hidden md:block">
            {profile?.avatar_emoji} {profile?.username}
          </span>
          <button onClick={signOut} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 h-[calc(100vh-65px)]">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: view === "editor" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full p-4"
        >
          {view === "editor" ? <CodeEditor /> : <GroupChat />}
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
