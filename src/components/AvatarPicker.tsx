import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const AVATARS = [
  "🧑‍💻", "👩‍💻", "👨‍💻", "👩‍🔬", "👨‍🔬", "🤖", "🦊", "🐱",
  "🦁", "🐸", "🐼", "🦄", "🐲", "🦅", "🐺", "🐙",
  "👾", "🎮", "🚀", "⚡", "🔥", "💎", "🎯", "🛡️",
];

interface AvatarPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export default function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {AVATARS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(emoji)}
          className={`relative text-2xl p-1.5 rounded-lg transition-colors ${
            selected === emoji
              ? "bg-primary/20 ring-2 ring-primary"
              : "hover:bg-secondary"
          }`}
        >
          {emoji}
          {selected === emoji && (
            <Check className="absolute -top-1 -right-1 w-3.5 h-3.5 text-primary bg-background rounded-full" />
          )}
        </motion.button>
      ))}
    </div>
  );
}
