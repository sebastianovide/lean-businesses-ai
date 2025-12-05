"use client";

import { useState, useRef, useEffect } from "react";

import {
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
import { CanvasSection } from "./canvas-section";
import { CanvasSection as CanvasSectionType } from "./types";

const initialCanvas: CanvasSectionType[] = [
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

const CanvasEditor = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Canvas ID management - get from URL or generate new
  const [canvasId, setCanvasId] = useState<string>("");
  const [canvasName, setCanvasName] = useState<string>("Untitled Canvas");

  const [canvas, setCanvas] = useState<CanvasSectionType[]>(initialCanvas);
  const [isChatOpen, setIsChatOpen] = useState(true);

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

  const addItem = (sectionId: string, subsectionTitle?: string) => {
    setCanvas((prev) => {
      return prev.map((section) => {
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
    });
  };

  const removeItem = (
    sectionId: string,
    index: number,
    subsectionTitle?: string
  ) => {
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
                  <CanvasSection
                    section={getSectionById("problem")}
                    className="bg-orange-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("solution")}
                    className="bg-blue-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <CanvasSection
                    section={getSectionById("unique-value-proposition")}
                    className="bg-yellow-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("unfair-advantage")}
                    className="bg-purple-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <CanvasSection
                    section={getSectionById("customer-segments")}
                    className="bg-indigo-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>

                {/* Row 2 */}
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("key-metrics")}
                    className="bg-teal-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("channels")}
                    className="bg-cyan-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>

                {/* Row 3 */}
                <div className="col-span-5">
                  <CanvasSection
                    section={getSectionById("cost-structure")}
                    className="bg-red-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-5">
                  <CanvasSection
                    section={getSectionById("revenue-streams")}
                    className="bg-green-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Chat sidebar */}
      <CanvasChat
        key={canvasId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        canvasId={canvasId}
        canvasState={canvas}
      />
    </div>
  );
};

export default CanvasEditor;
