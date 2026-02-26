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

  // ✅ Reset on run
  useEffect(() => {
    if (running) {
      setLines([{ type: "info", text: "⏳ Compiling & executing..." }]);
      setCurrentInput("");
      setCollectedInputs([]);
      setShowCursor(false);

      prevOutputRef.current = "";
      prevErrorRef.current = "";
    }
  }, [running]);

  // ✅ Handle error
  useEffect(() => {
    if (!running && error && error !== prevErrorRef.current) {
      prevErrorRef.current = error;
      setLines([{ type: "error", text: error }]);
      setShowCursor(false);
    }
  }, [error, running]);

  // ✅ Handle needsInput (show cursor even without output)
  useEffect(() => {
    if (running) return;
    if (needsInput) {
      setShowCursor(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [needsInput, running]);

  // ✅ Handle output (DIFF BASED)
  useEffect(() => {
    if (running) return;
    if (!output && !needsInput) return;

    let newText = output;

    // 🔥 Only take NEW part
    if (output.startsWith(prevOutputRef.current)) {
      newText = output.slice(prevOutputRef.current.length);
    }

    prevOutputRef.current = output;

    if (!newText) return;

    const newLines: TerminalLine[] = newText
      .split("\n")
      .filter((l) => l !== "")
      .map((l) => ({ type: "output" as const, text: l }));

    setLines((prev) => [...prev, ...newLines]);

    if (!needsInput) {
      setShowCursor(false);
      setLines((prev) => [
        ...prev,
        { type: "info", text: "✅ Program finished successfully" },
      ]);
    }
  }, [output, needsInput, running]);

  // ✅ Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, showCursor]);

  // ✅ Handle input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const inputValue = currentInput.trim();
      if (!inputValue) return;

      setLines((prev) => [
        ...prev,
        { type: "input", text: inputValue },
      ]);

      const newInputs = [...collectedInputs, inputValue];
      setCollectedInputs(newInputs);

      setCurrentInput("");
      setShowCursor(false);

      onSubmitInput(newInputs.join("\n"));
    }
  };

  // ✅ Clear terminal
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
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16213e] border-b border-[#0f3460]">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Terminal className="w-4 h-4 text-green-400" />
          )}
          <span className="text-xs font-mono font-bold text-[#e0e0e0]">
            Output
          </span>
        </div>

        {lines.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs font-mono border border-[#0f3460] rounded hover:bg-[#1a1a3e] text-[#999]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Body */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-3 font-mono text-sm overflow-auto cursor-text"
        onClick={() => showCursor && inputRef.current?.focus()}
      >
        {lines.length === 0 && !running ? (
          <span className="text-[#555] text-xs">
            Run your code to see output here...
          </span>
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

            {/* Input */}
            {showCursor && (
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none border-none text-cyan-300 font-mono text-sm w-full"
                autoFocus
              />
            )}

            {/* Cursor */}
            {!showCursor && !running && lines.length > 0 && (
              <span className="inline-block w-[2px] h-4 bg-green-400 animate-pulse mt-1" />
            )}

            {running && (
              <div className="text-[#888] animate-pulse mt-2">
                ⏳ Compiling & executing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
