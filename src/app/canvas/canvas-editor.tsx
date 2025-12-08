"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { Link as LinkIcon, Trash2, Download } from "lucide-react";

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
import { FloatingChatButton } from "@/components/floating-chat-button";
import CanvasChat from "./canvas-chat";
import CanvasSection from "./canvas-section";
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
  const initializationRef = useRef(false);

  // Canvas ID management - get from URL or generate new
  const [canvasId, setCanvasId] = useState<string>(() => {
    const urlCanvasId = searchParams.get("canvasId");
    return urlCanvasId || uuidv4();
  });

  const [canvasName, setCanvasName] = useState<string>("Untitled Canvas");
  const [canvas, setCanvas] = useState<CanvasSectionType[]>(initialCanvas);
  const hasLoadedFromStorageRef = useRef(false);

  const [isChatOpen, setIsChatOpen] = useState(true);

  // Update URL if canvas ID was generated locally
  useEffect(() => {
    if (!initializationRef.current) {
      const urlCanvasId = searchParams.get("canvasId");
      if (!urlCanvasId) {
        router.replace(`/canvas?canvasId=${canvasId}`);
        initializationRef.current = true;
      }
    }
  }, [canvasId, router, searchParams]);

  // Load canvas from localStorage on client side
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlCanvasId = searchParams.get("canvasId");
    if (!urlCanvasId) {
      console.log("No canvasId in URL, this is a new canvas");
      // Mark as loaded after a short delay for new canvases
      const timeoutId = setTimeout(() => {
        hasLoadedFromStorageRef.current = true;
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    console.log("Loading from localStorage with canvasId:", urlCanvasId);

    const loadData = () => {
      try {
        // Load canvas
        const storageKey = `lean-canvas-${urlCanvasId}`;
        console.log("Looking for storage key:", storageKey);
        const savedCanvas = localStorage.getItem(storageKey);
        console.log("Found canvas data:", !!savedCanvas);

        let foundCanvas = false;
        if (savedCanvas) {
          try {
            const parsedCanvas = JSON.parse(savedCanvas);
            console.log("Parsed canvas successfully:", parsedCanvas);
            setCanvas(parsedCanvas);
            foundCanvas = true;
            console.log("Canvas state updated from localStorage");
          } catch (parseError) {
            console.error("Failed to parse canvas JSON:", parseError);
            console.log("Raw canvas data:", savedCanvas);
          }
        } else {
          console.log("No saved canvas found, using initial canvas");
        }

        // Load canvas name
        const nameKey = `lean-canvas-name-${urlCanvasId}`;
        console.log("Looking for name key:", nameKey);
        const savedName = localStorage.getItem(nameKey);
        console.log("Found name data:", !!savedName);

        if (savedName) {
          console.log("Setting canvas name:", savedName);
          setCanvasName(savedName);
        } else {
          console.log("No saved name found, using default name");
        }

        // Mark as loaded after we've attempted to load
        hasLoadedFromStorageRef.current = true;
        console.log("Loading complete, found canvas:", foundCanvas);
      } catch (err) {
        console.error("Failed to load from localStorage:", err);
        // Reset to initial state if loading fails
        setCanvas(initialCanvas);
        setCanvasName("Untitled Canvas");
        hasLoadedFromStorageRef.current = true;
      }
    };

    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadData, 50);

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  // Helper to update the canvas index
  interface CanvasIndexEntry {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }

  const updateCanvasIndex = useCallback((id: string, name: string) => {
    if (typeof window === "undefined") {
      console.log("Skipping canvas index update: window undefined");
      return;
    }

    console.log("Updating canvas index for:", id, "with name:", name);

    try {
      const indexKey = "lean-canvases-index";
      const indexJson = localStorage.getItem(indexKey);
      console.log("Current index JSON:", indexJson);

      const index: CanvasIndexEntry[] = indexJson ? JSON.parse(indexJson) : [];
      console.log("Parsed index entries:", index.length);

      const now = new Date().toISOString();
      const existingEntryIndex = index.findIndex((item) => item.id === id);

      if (existingEntryIndex >= 0) {
        // Update existing entry
        console.log("Updating existing index entry");
        index[existingEntryIndex] = {
          ...index[existingEntryIndex],
          name,
          updatedAt: now,
        };
      } else {
        // Add new entry
        console.log("Adding new index entry");
        index.push({
          id,
          name,
          createdAt: now,
          updatedAt: now,
        });
      }

      const updatedIndexJson = JSON.stringify(index);
      localStorage.setItem(indexKey, updatedIndexJson);
      console.log("Canvas index updated successfully, entries:", index.length);
    } catch (err) {
      console.error("Failed to update canvas index:", err);
      console.error("Error details:", err instanceof Error ? err.message : err);
    }
  }, []);

  // Auto-save canvas to local storage whenever it changes (but only after initial load)
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !canvasId ||
      !hasLoadedFromStorageRef.current
    ) {
      console.log(
        "Skipping canvas save: window undefined, no canvasId, or not loaded yet"
      );
      return;
    }

    const storageKey = `lean-canvas-${canvasId}`;
    console.log("Auto-saving canvas with key:", storageKey);

    try {
      const canvasData = JSON.stringify(canvas);
      localStorage.setItem(storageKey, canvasData);
      console.log("Canvas saved successfully, data length:", canvasData.length);
    } catch (saveError) {
      console.error("Failed to save canvas to localStorage:", saveError);
      console.log("Canvas data that failed to save:", canvas);
    }
  }, [canvas, canvasId]);

  // Auto-save canvas name to local storage whenever it changes (but only after initial load)
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !canvasId ||
      !hasLoadedFromStorageRef.current
    ) {
      console.log(
        "Skipping canvas name save: window undefined, no canvasId, or not loaded yet"
      );
      return;
    }

    const nameKey = `lean-canvas-name-${canvasId}`;
    console.log(
      "Auto-saving canvas name with key:",
      nameKey,
      "name:",
      canvasName
    );

    try {
      localStorage.setItem(nameKey, canvasName);
      console.log("Canvas name saved successfully");
    } catch (saveError) {
      console.error("Failed to save canvas name to localStorage:", saveError);
      console.log("Canvas name that failed to save:", canvasName);
    }
  }, [canvasName, canvasId]);

  // Update canvas index when canvas or name changes
  useEffect(() => {
    if (!canvasId) return;

    updateCanvasIndex(canvasId, canvasName);
  }, [canvasId, canvasName, updateCanvasIndex]);

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
    if (typeof window === "undefined") return;

    // Delete from local storage
    const storageKey = `lean-canvas-${canvasId}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`lean-canvas-name-${canvasId}`);

    // Remove from index
    try {
      const indexKey = "lean-canvases-index";
      const indexJson = localStorage.getItem(indexKey);
      if (indexJson) {
        const index: CanvasIndexEntry[] = JSON.parse(indexJson);
        const newIndex = index.filter(
          (item: CanvasIndexEntry) => item.id !== canvasId
        );
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
          <div className="text-center py-2 bg-white px-6">
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
          <div className="flex-1 bg-gray-50 p-3 overflow-hidden flex flex-col">
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

      {/* Floating Chat Button - shown when chat is closed */}
      {!isChatOpen && (
        <FloatingChatButton
          onClick={() => setIsChatOpen(true)}
          hasUnread={false}
        />
      )}

      {/* Floating Chat Panel - shown when chat is open */}
      <CanvasChat
        key={canvasId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        canvasId={canvasId}
        canvasState={Object.fromEntries(
          canvas.map((section) => [section.id, section])
        )}
      />
    </div>
  );
};

export default CanvasEditor;
