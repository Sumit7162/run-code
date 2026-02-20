import { useState } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Terminal, Copy, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export default function CodeEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("run-cpp", {
        body: { code },
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 text-sm font-mono bg-secondary text-primary border-b-2 border-primary rounded-t-md">
            C++
          </span>
          <span className="text-xs text-muted-foreground font-mono">Write & run any C++ code</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-mono text-sm hover:opacity-90 transition-opacity disabled:opacity-50 glow-primary"
          >
            <Play className="w-4 h-4" />
            {running ? "Compiling..." : "Run"}
          </button>
        </div>
      </div>

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

      {/* Output */}
      <AnimatePresence>
        {(output || error || running) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50">
              {error ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <Terminal className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {error ? "Compilation Error" : "Output"}
              </span>
            </div>
            <pre className={`px-4 py-3 font-mono text-sm max-h-48 overflow-auto bg-code-bg ${error ? "text-destructive" : "text-accent"}`}>
              {running ? (
                <span className="text-muted-foreground animate-pulse">Compiling & executing...</span>
              ) : (
                error || output
              )}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
