"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
  className?: string;
}

export function FloatingChatButton({
  onClick,
  hasUnread = false,
  className = "",
}: FloatingChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 
        w-14 h-14 
        rounded-full 
        bg-blue-600 hover:bg-blue-700 
        text-white 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 
        z-50 
        animate-pulse hover:animate-none
        transform hover:scale-110 active:scale-95
        hover:animate-bounce
        ${className}
      `}
      size="sm"
    >
      <MessageSquare size={24} />
      {hasUnread && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      )}
    </Button>
  );
}
