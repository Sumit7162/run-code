import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error("Username is required");
        await signUp(email, password, username.trim());
      } else {
        await signIn(email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="font-display font-bold text-2xl glow-text">CodeForge</h1>
          </div>

          <h2 className="text-center text-foreground font-display text-lg mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
            />

            {error && (
              <p className="text-destructive text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 font-mono text-sm hover:opacity-90 transition-opacity disabled:opacity-50 glow-primary"
            >
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs font-mono mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
