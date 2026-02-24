import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Terminal, AlertTriangle } from "lucide-react";

interface TerminalLine {
  type: "output" | "input" | "error" | "info";
  text: string;
}

interface InteractiveTerminalProps {
  running: boolean;
  onSubmitInput: (stdin: string) => void;
  output: string;
  error: string;
  needsInput: boolean;
}

export default function InteractiveTerminal({
  running,
  onSubmitInput,
  output,
  error,
  needsInput,
}: InteractiveTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [collectedInputs, setCollectedInputs] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const prevOutputRef = useRef("");
  const prevErrorRef = useRef("");

  // Reset on new run
  useEffect(() => {
    if (running) {
      setLines([{ type: "info", text: "⏳ Compiling & executing..." }]);
      setShowCursor(false);
      setCurrentInput("");
      setCollectedInputs([]);
      prevOutputRef.current = "";
      prevErrorRef.current = "";
    }
  }, [running]);

  // Handle error
  useEffect(() => {
    if (!running && error && error !== prevErrorRef.current) {
      prevErrorRef.current = error;
      setLines([{ type: "error", text: error }]);
      setShowCursor(false);
    }
  }, [error, running]);

  // Handle output changes
 useEffect(() => {
  if (running || !output || output === prevOutputRef.current) return;
  prevOutputRef.current = output;

  const outputText = output === "(no output)" ? "" : output;

  const newLines: TerminalLine[] = outputText
    .split("\n")
    .map((l) => ({ type: "output" as const, text: l }));

  setLines((prev) => [...prev, ...newLines]); // ✅ append instead of replace

  if (needsInput) {
    setShowCursor(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  } else {
    setShowCursor(false);

    setLines((prev) => [
      ...prev,
      { type: "info", text: "✅ Program finished successfully" },
    ]);
  }
}, [output, needsInput, running]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, showCursor]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput !== "") {
      const inputValue = currentInput;
      const newInputs = [...collectedInputs, inputValue];
      setCollectedInputs(newInputs);

      // Append user input to lines visually
      setLines((prev) => [
        ...prev,
        { type: "input", text: inputValue },
      ]);

      setCurrentInput("");
      setShowCursor(false);

      // Re-run with all collected inputs
      onSubmitInput(newInputs.join("\n"));
    }
  };

  const handleClear = () => {
    setLines([]);
    setCollectedInputs([]);
    setCurrentInput("");
    setShowCursor(false);
    prevOutputRef.current = "";
    prevErrorRef.current = "";
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#1a1a2e]">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213e] border-b border-[#0f3460]">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Terminal className="w-4 h-4 text-green-400" />
          )}
          <span className="text-xs font-mono font-bold text-[#e0e0e0]">Output</span>
        </div>
        {lines.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs font-mono border border-[#0f3460] rounded hover:bg-[#1a1a3e] transition-colors text-[#999]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-3 font-mono text-sm overflow-auto cursor-text"
        onClick={() => showCursor && inputRef.current?.focus()}
      >
        {lines.length === 0 && !running ? (
          <span className="text-[#555] text-xs">Run your code to see output here...</span>
        ) : (
          <>
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "error"
                    ? "text-red-400 whitespace-pre-wrap"
                    : line.type === "info"
                    ? "text-green-400/70 mt-2 text-xs"
                    : line.type === "input"
                    ? "text-cyan-300 whitespace-pre-wrap"
                    : "text-[#d4d4d4] whitespace-pre-wrap"
                }
              >
                {line.text}
              </div>
            ))}

            {/* Inline blinking cursor input */}
            {showCursor && (
              <div className="flex items-center mt-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent outline-none border-none text-cyan-300 font-mono text-sm flex-1 caret-green-400"
                  style={{ caretColor: "#4ade80" }}
                  autoFocus
                  spellCheck={false}
                />
              </div>
            )}

            {/* Blinking cursor when idle and showing cursor */}
            {!showCursor && !running && lines.length > 0 && lines[lines.length - 1]?.type !== "info" && (
              <div className="h-4 mt-1">
                <span className="inline-block w-[2px] h-4 bg-green-400 animate-pulse" />
              </div>
            )}

            {running && (
              <span className="text-[#888] animate-pulse">⏳ Compiling & executing...</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
