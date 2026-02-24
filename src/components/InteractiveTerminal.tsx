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
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [partialOutput, setPartialOutput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // When output changes (code finished running), display it
  useEffect(() => {
    if (running) {
      // Clear and show running state
      setLines([{ type: "info", text: "Compiling & executing..." }]);
      setWaitingForInput(false);
      return;
    }

    if (error) {
      setLines([{ type: "error", text: error }]);
      setWaitingForInput(false);
      return;
    }

    if (output) {
      // Merge collected inputs with output to create terminal-like display
      const outputText = output === "(no output)" ? "" : output;
      
      if (collectedInputs.length > 0) {
        // Interleave output lines with user inputs
        const outputLines = outputText.split("\n");
        const merged: TerminalLine[] = [];
        let inputIdx = 0;
        
        for (const line of outputLines) {
          // Check if this line ends with a prompt-like pattern (ends with : or ? followed by space or the input value)
          const hasInlineInput = inputIdx < collectedInputs.length && 
            line.includes(collectedInputs[inputIdx]);
          
          if (hasInlineInput) {
            merged.push({ type: "output", text: line });
            inputIdx++;
          } else {
            merged.push({ type: "output", text: line });
          }
        }
        
        if (merged.length === 0 && outputText) {
          merged.push({ type: "output", text: outputText });
        }
        
        merged.push({ type: "info", text: "=== Code Execution Successful ===" });
        setLines(merged);
      } else {
        const displayLines: TerminalLine[] = outputText
          .split("\n")
          .map((l) => ({ type: "output" as const, text: l }));
        if (outputText) {
          displayLines.push({ type: "info", text: "=== Code Execution Successful ===" });
        }
        setLines(displayLines.length > 0 ? displayLines : [{ type: "output", text: "(no output)" }]);
      }
      setWaitingForInput(false);
    }
  }, [output, error, running]);

  // When needsInput becomes true, show waiting state
  useEffect(() => {
    if (needsInput && !running) {
      setWaitingForInput(true);
      setLines((prev) => {
        // Show partial output if any, then cursor
        if (partialOutput) {
          const outputLines = partialOutput.split("\n").map((l) => ({
            type: "output" as const,
            text: l,
          }));
          return outputLines;
        }
        return prev.filter((l) => l.type !== "info");
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [needsInput, running, partialOutput]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, waitingForInput]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput !== "") {
      const newInputs = [...collectedInputs, currentInput];
      setCollectedInputs(newInputs);
      
      // Add the input line to display
      setLines((prev) => [
        ...prev,
        { type: "output", text: (prev.length > 0 ? "" : "") + currentInput },
      ]);
      
      setCurrentInput("");
      setWaitingForInput(false);
      
      // Submit all collected inputs
      onSubmitInput(newInputs.join("\n"));
    }
  };

  const handleClear = () => {
    setLines([]);
    setCollectedInputs([]);
    setCurrentInput("");
    setWaitingForInput(false);
    setPartialOutput("");
  };

  const handleTerminalClick = () => {
    if (waitingForInput) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#1e1e1e]">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Terminal className="w-4 h-4 text-green-400" />
          )}
          <span className="text-xs font-mono font-bold text-[#cccccc]">Output</span>
        </div>
        {lines.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs font-mono border border-[#404040] rounded hover:bg-[#3a3a3a] transition-colors text-[#999]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="flex-1 px-4 py-3 font-mono text-sm overflow-auto cursor-text"
        onClick={handleTerminalClick}
      >
        {lines.length === 0 && !running ? (
          <span className="text-[#666] text-xs">Run your code to see output here...</span>
        ) : (
          <>
            {lines.map((line, i) => (
              <div key={i} className={
                line.type === "error" ? "text-red-400 whitespace-pre-wrap" :
                line.type === "info" ? "text-green-400/60 mt-2 text-xs" :
                line.type === "input" ? "text-cyan-300 whitespace-pre-wrap" :
                "text-[#d4d4d4] whitespace-pre-wrap"
              }>
                {line.text}
              </div>
            ))}
            
            {/* Inline input when waiting */}
            {waitingForInput && (
              <div className="flex items-center text-[#d4d4d4]">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent outline-none border-none text-cyan-300 font-mono text-sm flex-1 caret-green-400"
                  autoFocus
                  spellCheck={false}
                />
              </div>
            )}
            
            {running && (
              <span className="text-[#888] animate-pulse">Compiling & executing...</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
