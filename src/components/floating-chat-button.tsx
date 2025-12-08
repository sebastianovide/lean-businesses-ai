"use client";

import { BotMessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Button
        onClick={onClick}
        size="icon-lg"
        className="size-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 [&_svg]:size-6"
      >
        <BotMessageSquare />

        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex size-5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              !
            </span>
          </span>
        )}
      </Button>
    </div>
  );
}
