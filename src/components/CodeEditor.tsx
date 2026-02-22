import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Terminal, Copy, Check, AlertTriangle, Save, FolderOpen, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;

    // Try writing your own C++ code!
    for (int i = 1; i <= 5; i++) {
        cout << "Count: " << i << endl;
    }

    return 0;
}
`;

interface SavedCode {
  id: string;
  title: string;
  code: string;
  output: string | null;
  created_at: string;
}

export default function CodeEditor() {
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);

  const fetchSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_codes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSavedCodes(data);
  };

  useEffect(() => {
    if (showSaved) fetchSaved();
  }, [showSaved, user]);

  // Detect if code uses cin/scanf/getline
  const needsInput = /\b(cin\s*>>|scanf\s*\(|getline\s*\(|gets\s*\()/.test(code);

  const handleRun = async () => {
    if (needsInput && !waitingForInput) {
      // Show input prompt in output section first
      setOutput("");
      setError("");
      setStdinInput("");
      setWaitingForInput(true);
      return;
    }

    setWaitingForInput(false);
    setRunning(true);
    setOutput("");
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("run-cpp", {
        body: { code, stdin: stdinInput },
      });
      if (fnError) {
        setError(`Error: ${fnError.message}`);
      } else if (data.compileError) {
        setError(data.compileError);
      } else if (data.runtimeError && !data.output) {
        setError(data.runtimeError);
      } else {
        setOutput(data.output || "(no output)");
        if (data.runtimeError) {
          setOutput((prev) => prev + "\n⚠️ " + data.runtimeError);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute code");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!user || !saveTitle.trim()) return;
    const { error: err } = await supabase.from("saved_codes").insert({
      user_id: user.id,
      title: saveTitle.trim(),
      code,
      output: output || null,
    });
    if (err) {
      toast.error("Failed to save code");
    } else {
      toast.success("Code saved!");
      setSaveTitle("");
      setShowSaveDialog(false);
      fetchSaved();
    }
  };

  const handleLoad = (saved: SavedCode) => {
    setCode(saved.code);
    setOutput(saved.output || "");
    setError("");
    setShowSaved(false);
    toast.success(`Loaded: ${saved.title}`);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("saved_codes").delete().eq("id", id);
    setSavedCodes((prev) => prev.filter((s) => s.id !== id));
    toast.success("Deleted");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main editor */}
      <div className="flex flex-col flex-1 glass rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 text-sm font-mono bg-secondary text-primary border-b-2 border-primary rounded-t-md">C++</span>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">Write & run any C++ code</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSaved(!showSaved)} className={`p-2 transition-colors rounded-md ${showSaved ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Saved codes">
              <FolderOpen className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSaveDialog(true)} className="p-2 text-muted-foreground hover:text-accent transition-colors" title="Save code">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={handleCopy} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Copy code">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={handleRun} disabled={running} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-mono text-sm hover:opacity-90 transition-opacity disabled:opacity-50 glow-primary">
              <Play className="w-4 h-4" />
              {running ? "Compiling..." : "Run"}
            </button>
          </div>
        </div>

        {/* Save dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border bg-secondary/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Enter a name for this code..."
                  className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
                <button onClick={handleSave} disabled={!saveTitle.trim()} className="px-4 py-2 bg-accent text-accent-foreground rounded-md font-mono text-xs hover:opacity-90 disabled:opacity-50">
                  Save
                </button>
                <button onClick={() => setShowSaveDialog(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language="cpp"
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              lineNumbers: "on",
              renderLineHighlight: "gutter",
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        <AnimatePresence>
          {(output || error || running || waitingForInput) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50">
                {error ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Terminal className="w-4 h-4 text-primary" />}
                <span className="text-xs font-mono text-muted-foreground">{error ? "Compilation Error" : "Output"}</span>
              </div>
              <div className={`px-4 py-3 font-mono text-sm max-h-48 overflow-auto bg-code-bg ${error ? "text-destructive" : "text-accent"}`}>
                {running ? (
                  <span className="text-muted-foreground animate-pulse">Compiling & executing...</span>
                ) : waitingForInput ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">Your code requires input. Type values below and press Enter to run:</p>
                    <div className="flex items-start gap-2">
                      <span className="text-primary select-none">{">"}</span>
                      <textarea
                        value={stdinInput}
                        onChange={(e) => setStdinInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleRun();
                          }
                        }}
                        placeholder="Enter input values (one per line)..."
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none font-mono text-sm min-h-[24px]"
                        rows={2}
                        autoFocus
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">Press Enter to execute • Shift+Enter for new line</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{error || output}</pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Saved codes panel */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-display font-semibold text-sm text-foreground">Saved Code</h3>
              <button onClick={() => setShowSaved(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {savedCodes.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono text-center py-8">No saved code yet.<br />Click 💾 to save your first!</p>
              ) : (
                savedCodes.map((s) => (
                  <div key={s.id} className="bg-secondary/50 rounded-lg p-3 group hover:bg-secondary transition-colors">
                    <div className="flex items-start justify-between">
                      <button onClick={() => handleLoad(s)} className="text-left flex-1">
                        <h4 className="text-sm font-mono text-foreground truncate">{s.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(s.created_at).toLocaleDateString()} · {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <pre className="text-xs font-mono text-muted-foreground mt-2 line-clamp-3 overflow-hidden">{s.code.slice(0, 120)}...</pre>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
