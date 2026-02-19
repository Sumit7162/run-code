import { useState } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Terminal, Copy, Check } from "lucide-react";

type Language = "python" | "cpp" | "java";

const DEFAULTS: Record<Language, string> = {
  python: `# Python Code Runner
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
`,
  cpp: `// C++ Code Runner
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    for (int i = 0; i < 10; i++) {
        cout << "fib(" << i << ") = " << fibonacci(i) << endl;
    }
    return 0;
}
`,
  java: `// Java Code Runner
public class Main {
    static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            System.out.println("fib(" + i + ") = " + fibonacci(i));
        }
    }
}
`,
};

const MOCK_OUTPUT: Record<Language, string> = {
  python: `fib(0) = 0\nfib(1) = 1\nfib(2) = 1\nfib(3) = 2\nfib(4) = 3\nfib(5) = 5\nfib(6) = 8\nfib(7) = 13\nfib(8) = 21\nfib(9) = 34`,
  cpp: `fib(0) = 0\nfib(1) = 1\nfib(2) = 1\nfib(3) = 2\nfib(4) = 3\nfib(5) = 5\nfib(6) = 8\nfib(7) = 13\nfib(8) = 21\nfib(9) = 34`,
  java: `fib(0) = 0\nfib(1) = 1\nfib(2) = 1\nfib(3) = 2\nfib(4) = 3\nfib(5) = 5\nfib(6) = 8\nfib(7) = 13\nfib(8) = 21\nfib(9) = 34`,
};

const LANG_MAP: Record<Language, string> = {
  python: "python",
  cpp: "cpp",
  java: "java",
};

const LANG_COLORS: Record<Language, string> = {
  python: "text-code-accent",
  cpp: "text-primary",
  java: "text-accent",
};

export default function CodeEditor() {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<Record<Language, string>>(DEFAULTS);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setOutput("");
    setTimeout(() => {
      setOutput(MOCK_OUTPUT[language]);
      setRunning(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code[language]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1">
        <div className="flex gap-1">
          {(["python", "cpp", "java"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 text-sm font-mono rounded-t-md transition-all ${
                language === lang
                  ? `bg-secondary ${LANG_COLORS[lang]} border-b-2 border-primary`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "cpp" ? "C++" : lang === "java" ? "Java" : "Python"}
            </button>
          ))}
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
            {running ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANG_MAP[language]}
          value={code[language]}
          onChange={(val) => setCode((prev) => ({ ...prev, [language]: val || "" }))}
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
        {(output || running) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">Output</span>
            </div>
            <pre className="px-4 py-3 font-mono text-sm text-accent max-h-40 overflow-auto bg-code-bg">
              {running ? (
                <span className="text-muted-foreground animate-pulse">Compiling & executing...</span>
              ) : (
                output
              )}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
