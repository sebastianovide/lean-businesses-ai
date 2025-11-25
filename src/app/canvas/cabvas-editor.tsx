"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Save,
  Plus,
  Minus,
  Link as LinkIcon,
  Trash2,
  Download,
  MessageSquare,
  X,
  GripVertical,
} from "lucide-react";

import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CanvasSection {
  id: string;
  order: number;
  title?: string;
  items?: string[];
  subsections?: { title: string; items: string[] }[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentActivity?: Array<{
    type: "start" | "finish" | "delegation";
    agent: string;
    timestamp: number;
  }>;
}

const initialCanvas: CanvasSection[] = [
  {
    id: "problem",
    title: "Problem",
    order: 2,
    subsections: [
      { title: "Problem", items: [] },
      { title: "Existing Alternatives", items: [] },
    ],
  },
  {
    id: "solution",
    order: 4,
    title: "Solution",
    items: [],
  },
  {
    id: "key-metrics",
    order: 8,
    title: "Key Metrics",
    items: [],
  },
  {
    id: "unique-value-proposition",
    title: "Unique Value Proposition",
    order: 3,
    subsections: [
      { title: "Unique Value Proposition", items: [] },
      { title: "High Level Concept", items: [] },
    ],
  },
  {
    id: "unfair-advantage",
    order: 9,
    title: "Unfair Advantage",
    items: [],
  },
  {
    id: "channels",
    order: 5,
    title: "Channels",
    items: [],
  },
  {
    id: "customer-segments",
    title: "Customer Segments",
    order: 1,
    subsections: [
      { title: "Customer Segments", items: [] },
      { title: "Early Adopter", items: [] },
    ],
  },
  {
    id: "cost-structure",
    order: 7,
    title: "Cost Structure",
    items: [],
  },
  {
    id: "revenue-streams",
    order: 6,
    title: "Revenue Streams",
    items: [],
  },
];

const CanvasEditor: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Canvas ID management - get from URL or generate new
  const [canvasId, setCanvasId] = useState<string>("");
  const [canvasName, setCanvasName] = useState<string>("Untitled Canvas");

  const [canvas, setCanvas] = useState<CanvasSection[]>(initialCanvas);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Custom state for agent tracking
  const [agentStatus, setAgentStatus] = useState<string | null>(null);

  // Manual input state
  const [inputValue, setInputValue] = useState("");

  // useChat hook with DefaultChatTransport
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // Initialize canvas ID from URL or generate new
  useEffect(() => {
    const urlCanvasId = searchParams.get("canvasId");
    if (urlCanvasId) {
      setCanvasId(urlCanvasId);
    } else {
      const newId = uuidv4();
      setCanvasId(newId);
      router.replace(`/canvas?canvasId=${newId}`);
    }
  }, [searchParams, router]);

  // Load canvas from local storage when canvasId changes
  useEffect(() => {
    if (!canvasId) return;

    const storageKey = `lean-canvas-${canvasId}`;
    const savedCanvas = localStorage.getItem(storageKey);
    const savedName = localStorage.getItem(`lean-canvas-name-${canvasId}`);

    if (savedCanvas) {
      try {
        const parsed = JSON.parse(savedCanvas);
        setCanvas(parsed);
      } catch (err) {
        console.error("Failed to load canvas from storage:", err);
      }
    }

    if (savedName) {
      setCanvasName(savedName);
    }
  }, [canvasId]);

  // Helper to update the canvas index
  const updateCanvasIndex = (
    id: string,
    name: string,
    isNew: boolean = false
  ) => {
    try {
      const indexKey = "lean-canvases-index";
      const indexJson = localStorage.getItem(indexKey);
      let index: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      }[] = indexJson ? JSON.parse(indexJson) : [];

      const now = new Date().toISOString();
      const existingEntryIndex = index.findIndex((item) => item.id === id);

      if (existingEntryIndex >= 0) {
        // Update existing entry
        index[existingEntryIndex] = {
          ...index[existingEntryIndex],
          name,
          updatedAt: now,
        };
      } else {
        // Add new entry
        index.push({
          id,
          name,
          createdAt: now,
          updatedAt: now,
        });
      }

      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (err) {
      console.error("Failed to update canvas index:", err);
    }
  };

  // Auto-save canvas to local storage whenever it changes
  useEffect(() => {
    if (!canvasId) return;

    const storageKey = `lean-canvas-${canvasId}`;
    localStorage.setItem(storageKey, JSON.stringify(canvas));

    // Update index with new timestamp
    updateCanvasIndex(canvasId, canvasName);
  }, [canvas, canvasId]);

  // Auto-save canvas name to local storage whenever it changes
  useEffect(() => {
    if (!canvasId) return;

    localStorage.setItem(`lean-canvas-name-${canvasId}`, canvasName);

    // Update index with new name
    updateCanvasIndex(canvasId, canvasName);
  }, [canvasName, canvasId]);

  // No manual sendMessage needed - useChat handles this

  // Helper to format agent names for display
  const formatAgentName = (agentName: string): string => {
    // Convert "customer-insight-agent" to "Customer Insight Agent"
    return agentName
      .replace(/-agent$/i, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Pass additional data in the second argument
    sendMessage(
      { text: inputValue },
      {
        body: {
          canvasId,
          canvasState: canvas,
        },
      }
    );
    setInputValue("");
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Track which item is being edited
  const [editing, setEditing] = useState<{
    sectionId: string;
    subsectionTitle?: string;
    index: number;
  } | null>(null);

  // Track the index of the pending new item for each section/subsection
  const [pendingNewItem, setPendingNewItem] = useState<{
    sectionId: string;
    subsectionTitle?: string;
    index: number;
  } | null>(null);

  // Ref for input elements
  const inputRefs = useRef<Record<string, HTMLInputElement[]>>({});

  // Config state for AI service - simplified for display only as we use server-side agent
  const [showConfig, setShowConfig] = useState(false);

  // Track open/closed state for each Collapsible in chat (keyed by message and part index)
  const [collapsibleOpen, setCollapsibleOpen] = useState<
    Record<string, boolean>
  >({});

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Resize handlers
  const startResizing = React.useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      setIsResizing(true);
    },
    []
  );

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setChatWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Helper to get section/subsection title
  const getSectionAndSubTitle = (
    sectionId: string,
    subsectionTitle?: string
  ) => {
    const section = initialCanvas.find((s) => s.id === sectionId);
    if (!section) return { sectionTitle: sectionId, subsectionTitle };
    if (subsectionTitle)
      return { sectionTitle: section.title || section.id, subsectionTitle };
    return {
      sectionTitle: section.title || section.id,
      subsectionTitle: undefined,
    };
  };

  // Helper to get current items after change
  const getCurrentItems = (
    sectionId: string,
    subsectionTitle?: string,
    canvasState = canvas
  ) => {
    const section = canvasState.find((s) => s.id === sectionId);
    if (!section) return [];
    if (subsectionTitle && section.subsections) {
      const sub = section.subsections.find((s) => s.title === subsectionTitle);
      return sub ? sub.items : [];
    }
    return section.items || [];
  };

  const addItem = (sectionId: string, subsectionTitle?: string) => {
    // Get current items to determine new index
    const items = getCurrentItems(sectionId, subsectionTitle);
    const newIndex = items.length;

    setCanvas((prev) => {
      const next = prev.map((section) => {
        if (section.id === sectionId) {
          if (subsectionTitle && section.subsections) {
            return {
              ...section,
              subsections: section.subsections.map((sub) => {
                if (sub.title === subsectionTitle && sub.items.length < 3) {
                  return { ...sub, items: [...sub.items, ""] };
                }
                return sub;
              }),
            };
          } else if (
            !subsectionTitle &&
            section?.items &&
            section?.items?.length < 3
          ) {
            return { ...section, items: [...section.items, ""] };
          }
        }
        return section;
      });
      setPendingNewItem({ sectionId, subsectionTitle, index: newIndex });
      return next;
    });

    // After canvas update, focus the new input
    setTimeout(() => {
      const key = subsectionTitle
        ? `${sectionId}-${subsectionTitle}`
        : sectionId;
      if (inputRefs.current[key] && inputRefs.current[key][newIndex]) {
        inputRefs.current[key][newIndex].focus();
        inputRefs.current[key][newIndex].select();
      }
      setEditing({ sectionId, subsectionTitle, index: newIndex });
    }, 0);
  };

  const removeItem = (
    sectionId: string,
    index: number,
    subsectionTitle?: string
  ) => {
    // Get the item to be removed BEFORE updating state
    const items = getCurrentItems(sectionId, subsectionTitle);
    const removedItem = items[index] || "";

    // If the removed item is the pending new item or being edited, clear both before updating the canvas
    if (
      pendingNewItem &&
      pendingNewItem.sectionId === sectionId &&
      pendingNewItem.index === index &&
      pendingNewItem.subsectionTitle === subsectionTitle
    ) {
      setPendingNewItem(null);
    }
    if (
      editing &&
      editing.sectionId === sectionId &&
      editing.index === index &&
      editing.subsectionTitle === subsectionTitle
    ) {
      setEditing(null);
    }

    // Update canvas state
    setCanvas((prev) => {
      return prev.map((section) => {
        if (section.id === sectionId) {
          if (subsectionTitle && section.subsections) {
            return {
              ...section,
              subsections: section.subsections.map((sub) => {
                if (sub.title === subsectionTitle) {
                  return {
                    ...sub,
                    items: sub.items.filter((_, i) => i !== index),
                  };
                }
                return sub;
              }),
            };
          } else if (!subsectionTitle) {
            return {
              ...section,
              items: section?.items?.filter((_, i) => i !== index),
            };
          }
        }
        return section;
      });
    });

    // Only send chat message if removedItem is non-empty
    // Chat trigger removed as per user request
  };

  // Modified updateItem: only update value, do not send bot message
  const updateItem = (
    sectionId: string,
    index: number,
    value: string,
    subsectionTitle?: string
  ) => {
    setCanvas((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          if (subsectionTitle && section.subsections) {
            return {
              ...section,
              subsections: section.subsections.map((sub) =>
                sub.title === subsectionTitle
                  ? {
                      ...sub,
                      items: sub.items.map((item, i) =>
                        i === index ? value : item
                      ),
                    }
                  : sub
              ),
            };
          } else if (!subsectionTitle) {
            return {
              ...section,
              items: section?.items?.map((item, i) =>
                i === index ? value : item
              ),
            };
          }
        }
        return section;
      })
    );
  };

  // New: handle when editing is finished (onBlur or Enter)
  const handleItemEditDone = (
    sectionId: string,
    value: string,
    subsectionTitle?: string,
    index?: number
  ) => {
    // Prevent message if item no longer exists (was just removed)
    const items = getCurrentItems(sectionId, subsectionTitle);
    if (typeof index === "number" && (index < 0 || index >= items.length)) {
      setEditing(null);
      return;
    }
    // Only send bot message if this is the pending new item and value is non-empty
    // Chat trigger removed as per user request
    if (
      value.trim() !== "" &&
      editing &&
      editing.sectionId === sectionId &&
      editing.index === index &&
      editing.subsectionTitle === subsectionTitle
    ) {
      setPendingNewItem(null);
    }
    setEditing(null);
  };

  const renderItems = (
    items: string[],
    sectionId: string,
    subsectionTitle?: string
  ) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 group min-w-0 overflow-x-hidden"
        >
          <input
            type="text"
            ref={(el) => {
              const key = subsectionTitle
                ? `${sectionId}-${subsectionTitle}`
                : sectionId;
              if (!inputRefs.current[key]) {
                inputRefs.current[key] = [];
              }
              if (el) {
                inputRefs.current[key][index] = el;
              }
            }}
            value={item}
            onFocus={(e) => {
              // If this is a new empty item, set editing state immediately
              if (item === "") {
                setEditing({ sectionId, subsectionTitle, index });
                // Select all text to make it easier to start typing
                (e.target as HTMLInputElement).select();
              }
            }}
            onBlur={(e) => {
              if (
                editing &&
                editing.sectionId === sectionId &&
                editing.index === index &&
                editing.subsectionTitle === subsectionTitle
              ) {
                handleItemEditDone(
                  sectionId,
                  e.target.value,
                  subsectionTitle,
                  index
                );
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            onChange={(e) =>
              updateItem(sectionId, index, e.target.value, subsectionTitle)
            }
            className="w-full max-w-[calc(100%-32px)] px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset focus:border-blue-500 truncate"
            placeholder="Enter item..."
          />
          <button
            onClick={() => removeItem(sectionId, index, subsectionTitle)}
            className="p-1 text-red-500 hover:text-red-700 shrink-0"
          >
            <Minus size={12} />
          </button>
        </div>
      ))}
      {items.length < 3 && (
        <button
          onClick={() => addItem(sectionId, subsectionTitle)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      )}
    </div>
  );

  const renderSection = (section: CanvasSection, className: string = "") => (
    <div
      className={`border-2 border-gray-300 p-3 h-full flex flex-col relative overflow-x-hidden ${
        className || "bg-white"
      }`}
    >
      {/* Order number in top-right corner */}
      <div className="absolute bottom-1 right-1 bg-gray-800 text-white text-xs font-bold full w-5 h-5 flex items-center justify-center">
        {section.order}
      </div>

      {!section.subsections && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
            {section.title}
          </h3>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {`${section?.items?.length || 0}/3`}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {section.subsections ? (
          <div className="h-full flex flex-col">
            {section.subsections.map((subsection) => (
              <div
                key={subsection.title}
                className="flex-1 border-b border-gray-200 pb-2 last:border-b-0 last:pb-0 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                    {subsection.title}
                  </h3>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {`${subsection.items.length}/3`}
                  </div>
                </div>
                <div className="flex-1">
                  {renderItems(subsection.items, section.id, subsection.title)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderItems(section?.items || [], section.id)
        )}
      </div>
    </div>
  );

  const getSectionById = (id: string) =>
    canvas.find((section) => section.id === id)!;

  const handleSaveCanvas = () => {
    const json = JSON.stringify(canvas, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lean-canvas-${canvasId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearCanvas = () => {
    // Delete from local storage
    const storageKey = `lean-canvas-${canvasId}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`lean-canvas-name-${canvasId}`);

    // Remove from index
    try {
      const indexKey = "lean-canvases-index";
      const indexJson = localStorage.getItem(indexKey);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        const newIndex = index.filter((item: any) => item.id !== canvasId);
        localStorage.setItem(indexKey, JSON.stringify(newIndex));
      }
    } catch (err) {
      console.error("Failed to remove from canvas index:", err);
    }

    // Reset canvas to initial state
    setCanvas(initialCanvas);

    // Clear chat messages
    setMessages([]);

    // Generate new ID and redirect
    const newId = uuidv4();
    setCanvasId(newId);
    router.replace(`/canvas?canvasId=${newId}`);
  };

  // Collapsible component for <think> blocks
  function Collapsible({
    label,
    children,
    open,
    onToggle,
    forceOpenNoToggle,
  }: {
    label: string;
    children: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    forceOpenNoToggle?: boolean;
  }) {
    if (forceOpenNoToggle) {
      return (
        <div className="my-1">
          <div className="text-xs text-blue-600 font-semibold mb-1">
            {label}
          </div>
          <div className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded text-xs whitespace-pre-line">
            {children}
          </div>
        </div>
      );
    }
    return (
      <div className="my-1">
        <button
          type="button"
          className="text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none"
          onClick={onToggle}
        >
          {open ? "▼" : "▶"} {label}
        </button>
        {open && (
          <div className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded text-xs whitespace-pre-line">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
      <style>{`
        .dot-typing {
          display: inline-block;
        }
        .dot-typing .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 1px;
          background: #888;
          border-radius: 50%;
          animation: dot-typing 1s infinite linear alternate;
        }
        .dot-typing .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-typing .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-typing {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
      `}</style>
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Main content (canvas) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Navigation */}
          <div className="text-center py-4 bg-white border-b px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lean Canvas Editor
            </h1>
            <input
              type="text"
              value={canvasName}
              onChange={(e) => setCanvasName(e.target.value)}
              className="text-gray-600 text-center bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
              placeholder="Enter canvas name..."
            />

            {/* Navigation Links */}
            <div className="mt-4 flex justify-center gap-8">
              <Button
                asChild
                className="bg-gray-800 hover:bg-gray-900 text-white shadow-sm hover:shadow transition-all"
              >
                <Link href="/">
                  <LinkIcon size={16} />
                  Home
                </Link>
              </Button>
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all"
              >
                <Link href="/saved">Saved Canvases</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCanvas}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </Button>
              <Button
                variant={isChatOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="flex items-center gap-2"
              >
                <MessageSquare size={16} />
                {isChatOpen ? "Hide Chat" : "Show Chat"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your canvas and chat history from your local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCanvas}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Lean Canvas Grid Layout */}
          <div className="flex-1 bg-gray-50 p-6 overflow-hidden flex flex-col">
            <div className="bg-white p-4 rounded-lg shadow-lg flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-10 grid-rows-3 gap-0 h-full">
                {/* Row 1 */}
                <div className="col-span-2 row-span-2">
                  {renderSection(getSectionById("problem"), "bg-orange-50")}
                </div>
                <div className="col-span-2">
                  {renderSection(getSectionById("solution"), "bg-blue-50")}
                </div>
                <div className="col-span-2 row-span-2">
                  {renderSection(
                    getSectionById("unique-value-proposition"),
                    "bg-yellow-50"
                  )}
                </div>
                <div className="col-span-2">
                  {renderSection(
                    getSectionById("unfair-advantage"),
                    "bg-purple-50"
                  )}
                </div>
                <div className="col-span-2 row-span-2">
                  {renderSection(
                    getSectionById("customer-segments"),
                    "bg-indigo-50"
                  )}
                </div>

                {/* Row 2 */}
                <div className="col-span-2">
                  {renderSection(getSectionById("key-metrics"), "bg-teal-50")}
                </div>
                <div className="col-span-2">
                  {renderSection(getSectionById("channels"), "bg-cyan-50")}
                </div>

                {/* Row 3 */}
                <div className="col-span-5">
                  {renderSection(getSectionById("cost-structure"), "bg-red-50")}
                </div>
                <div className="col-span-5">
                  {renderSection(
                    getSectionById("revenue-streams"),
                    "bg-green-50"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Chat sidebar */}
      <aside
        className={`bg-white border-l shadow-lg flex flex-col h-full z-10 transition-all duration-300 ease-in-out relative ${
          isChatOpen ? "" : "w-0"
        } overflow-hidden`}
        style={{ width: isChatOpen ? chatWidth : 0 }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-20 flex items-center justify-center group"
          onMouseDown={startResizing}
        >
          {/* Hover Line */}
          <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-400 transition-colors" />

          {/* Grip Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center z-30">
            <GripVertical size={12} className="text-gray-400" />
          </div>
        </div>

        <div
          className="p-4 border-b font-bold text-lg text-blue-700 flex items-center justify-between"
          style={{ minWidth: chatWidth }}
        >
          <span>AI Brainstorm Chat</span>
          <button
            onClick={() => setIsChatOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Config Modal/Popover - Simplified for now */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={() => setShowConfig(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4 text-blue-700">
                AI Service Configuration
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                The AI service is now managed by the Mastra server agent.
                Client-side configuration is disabled.
              </p>
              <Button onClick={() => setShowConfig(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ minWidth: chatWidth }}
        >
          {messages.length === 0 && (
            <div className="text-gray-400 text-sm text-center">
              Start brainstorming with the AI!
            </div>
          )}
          {messages.map((msg: any, idx: number, arr: any[]) => {
            // Extract content from UIMessage format
            let messageContent = "";

            if (msg.parts && Array.isArray(msg.parts)) {
              // UIMessage format - extract text from parts
              for (const part of msg.parts) {
                if (part.type === "text" && part.text) {
                  messageContent += part.text;
                } else if (part.type === "data-network" && part.data?.output) {
                  // Extract output from data-network parts (agent responses)
                  messageContent += part.data.output;
                }
              }
            } else if (typeof msg.content === "string") {
              // Fallback for old format
              messageContent = msg.content;
            }

            // Skip messages with no content
            if (!messageContent) {
              return null;
            }

            // Enhanced: Split message content by <think>...</think> blocks, handling incomplete blocks
            const parts: Array<{
              type: "text" | "think";
              content: string;
              thinkKey?: string;
            }> = [];
            const regex = /<think>([\s\S]*?)(<\/think>|$)/g;
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(messageContent)) !== null) {
              if (match.index > lastIndex) {
                parts.push({
                  type: "text",
                  content: messageContent.slice(lastIndex, match.index),
                });
              }
              // Use the start index of the <think> block as a stable key
              parts.push({
                type: "think",
                content: match[1],
                thinkKey: `${msg.id}-${match.index}`,
              });
              lastIndex = regex.lastIndex;
              if (match[2] !== "</think>") break;
            }
            if (lastIndex < messageContent.length) {
              parts.push({
                type: "text",
                content: messageContent.slice(lastIndex),
              });
            }
            // Determine if this is the last message and a bot message and AI is thinking (streaming)
            const isStreamingBotMsg =
              status === "streaming" &&
              idx === arr.length - 1 &&
              msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[70%] text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {/* Agent Activity - Collapsible (Collapsed by Default) */}
                  {msg.role === "assistant" &&
                    msg.agentActivity &&
                    msg.agentActivity.length > 0 && (
                      <Collapsible
                        label={`🤖 Agent Activity (${msg.agentActivity.length} events)`}
                        open={collapsibleOpen[`activity-${msg.id}`] === true}
                        onToggle={() => {
                          setCollapsibleOpen(
                            (prev: Record<string, boolean>) => ({
                              ...prev,
                              [`activity-${msg.id}`]:
                                !prev[`activity-${msg.id}`],
                            })
                          );
                        }}
                      >
                        <div className="space-y-1">
                          {msg.agentActivity.map(
                            (
                              activity: {
                                type: string;
                                agent: string;
                                timestamp: number;
                              },
                              idx: number
                            ) => {
                              const friendlyName = formatAgentName(
                                activity.agent
                              );
                              let icon = "🤖";
                              let text = "";

                              if (activity.type === "start") {
                                icon = "▶️";
                                text = `${friendlyName} started`;
                              } else if (activity.type === "finish") {
                                icon = "✅";
                                text = `${friendlyName} completed`;
                              } else if (activity.type === "delegation") {
                                icon = "🔄";
                                text = `Delegated to ${friendlyName}`;
                              }

                              return (
                                <div
                                  key={idx}
                                  className="text-xs flex items-start gap-1"
                                >
                                  <span>{icon}</span>
                                  <span>{text}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </Collapsible>
                    )}

                  {/* Message Content */}
                  {parts.map((part, partIdx) =>
                    part.type === "think" ? (
                      <Collapsible
                        key={part.thinkKey}
                        label="AI internal reasoning"
                        open={
                          isStreamingBotMsg
                            ? true
                            : !!collapsibleOpen[part.thinkKey!]
                        }
                        onToggle={() => {
                          if (!isStreamingBotMsg) {
                            setCollapsibleOpen(
                              (prev: Record<string, boolean>) => ({
                                ...prev,
                                [part.thinkKey!]: !prev[part.thinkKey!],
                              })
                            );
                          }
                        }}
                        forceOpenNoToggle={isStreamingBotMsg}
                      >
                        {part.content.trim()}
                      </Collapsible>
                    ) : (
                      part.content && <span key={partIdx}>{part.content}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {/* AI typing indicator with agent status - COMPACT */}
          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 border border-gray-300">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block">
                    <span className="dot-typing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </span>
                  {agentStatus && (
                    <span className="font-medium">{agentStatus}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-red-600 text-xs">
            <span>Error: {error?.message || "Failed to send message"}</span>
          </div>
        )}

        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t flex gap-2"
          style={{ minWidth: chatWidth }}
        >
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ask the AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button type="submit" disabled={status === "streaming"}>
            Send
          </Button>
        </form>
      </aside>
    </div>
  );
};

export default CanvasEditor;
