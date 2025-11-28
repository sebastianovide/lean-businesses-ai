"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Plus,
  Minus,
  Link as LinkIcon,
  Trash2,
  Download,
  MessageSquare,
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
import { CanvasChat } from "./canvas-chat";

interface CanvasSection {
  id: string;
  order: number;
  title?: string;
  items?: string[];
  subsections?: { title: string; items: string[] }[];
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

  // Handler for chat message submission
  const handleChatSubmit = (message: string) => {
    sendMessage(
      { text: message },
      {
        body: {
          canvasId,
          canvasState: canvas,
        },
      }
    );
  };

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

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
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
      <CanvasChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        status={status}
        error={error}
        onSubmit={handleChatSubmit}
        canvasId={canvasId}
        canvasState={canvas}
      />
    </div>
  );
};

export default CanvasEditor;
