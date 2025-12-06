"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  ChainOfThought,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { DefaultChatTransport } from "ai";

interface CanvasChatProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId: string;
  canvasState: any;
}

export default function CanvasChat({
  isOpen,
  onClose,
  canvasId,
  canvasState,
}: CanvasChatProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        canvasId,
        canvasState,
      },
    }),
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Canvas Chat</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts?.map((part, i) => {
                    if (part.type === "text") {
                      return message.role === "assistant" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : (
                        <span key={i}>{part.text}</span>
                      );
                    }

                    if (part.type === "reasoning") {
                      return (
                        <ChainOfThought key={i}>
                          <ChainOfThoughtStep
                            title="Thinking..."
                            content={part.text}
                            label={undefined}
                          />
                        </ChainOfThought>
                      );
                    }

                    return null;
                  })}
                </MessageContent>
              </Message>
            ))}
            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>
      </div>

      <div className="p-4 border-t">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your canvas..."
              disabled={status !== "ready"}
            />
            <PromptInputSubmit disabled={status !== "ready"} />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
