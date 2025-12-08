"use client";

import { BotMessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
  className?: string;
}

export function FloatingChatButton({
  onClick,
  hasUnread = false,
  className,
}: FloatingChatButtonProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 transition-all duration-300 ${
        className || ""
      }`}
    >
      <Button onClick={onClick} size="icon" variant="outline">
        <BotMessageSquare />
        {hasUnread && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        )}
      </Button>
    </div>
  );
}
