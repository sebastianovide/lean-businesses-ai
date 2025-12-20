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
import { CanvasProvider, useCanvasContext } from "@/contexts/canvas-context";
import CanvasChat from "./canvas-chat";
import CanvasSection from "./canvas-section";
// Component that uses the canvas context
const CanvasEditorContent = () => {
  const {
    canvasId,
    canvasName,
    canvas,
    setCanvasId,
    setCanvasName,
    updateItem,
    addItem,
    removeItem,
    clearCanvas,
    loadFromStorage,
    applyToolChanges,
    clearPendingChanges,
  } = useCanvasContext();

  const searchParams = useSearchParams();
  const router = useRouter();
  const initializationRef = useRef(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Load canvas from localStorage on client side
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlCanvasId = searchParams.get("canvasId");
    if (!urlCanvasId) {
      // Mark as loaded after a short delay for new canvases
      const timeoutId = setTimeout(() => {
        // hasLoadedFromStorageRef.current = true; // This is now handled by the context
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    const loadData = () => {
      try {
        const storageData = localStorage.getItem("lean-canvases-storage");
        if (storageData) {
          const canvasStorage = JSON.parse(storageData);
          loadFromStorage(canvasStorage);
        }
      } catch (err) {
        console.error("Failed to load from localStorage:", err);
      }
    };

    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadData, 50);
    return () => clearTimeout(timeoutId);
  }, [searchParams, loadFromStorage]);

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

  // Initialization

  const getSectionById = (id: string) => canvas[id];

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

    // Remove from storage
    try {
      const storageData = localStorage.getItem("lean-canvases-storage");
      if (storageData) {
        const canvasStorage = JSON.parse(storageData);
        delete canvasStorage[canvasId];
        localStorage.setItem(
          "lean-canvases-storage",
          JSON.stringify(canvasStorage)
        );
      }
    } catch (err) {
      console.error("Failed to remove canvas from storage:", err);
    }

    // Reset canvas to initial state
    clearCanvas();

    // Generate new ID and redirect
    const newId = uuidv4();
    setCanvasId(newId);
    router.replace(`/canvas?canvasId=${newId}`);
  };

  // Handle new messages from chat
  const handleNewMessage = (messageCount: number) => {
    console.log("New message detected:", {
      messageCount,
      isChatOpen,
      lastMessageCount,
    });

    // Only process new messages when chat is closed
    if (!isChatOpen) {
      if (messageCount > lastMessageCount) {
        console.log("Setting unread to true - new messages while chat closed");
        setHasUnread(true);
        setLastMessageCount(messageCount); // Update baseline after setting unread
      }
    } else {
      console.log("Chat is open, updating message count");
      setLastMessageCount(messageCount);
    }
  };

  // Handle closing chat - set baseline message count
  const handleCloseChat = useCallback(() => {
    console.log("Chat closing, current message count:", lastMessageCount);
    setIsChatOpen(false);
    setHasUnread(false); // Clear unread when chat is opened
  }, [lastMessageCount]);

  // Handle opening chat - clear unread state
  const handleOpenChat = () => {
    console.log("Chat opening, clearing unread state");
    setIsChatOpen(true);
    setHasUnread(false);
  };

  // Debug: Log canvas state being passed to chat
  useEffect(() => {
    console.log("CanvasEditor - Canvas state changed:", {
      canvasId,
      canvasState: canvas,
      canvasKeys: Object.keys(canvas),
    });
  }, [canvas, canvasId]);

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden relative">
      <div
        className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out ${
          isChatOpen ? "mr-96" : "mr-0"
        }`}
      >
        {/* Main content (canvas) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Navigation */}
          <div className="text-center py-2 bg-white px-6 border-b">
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
            <div className="mt-4 flex justify-center gap-8 pb-2">
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
                    sectionId="problem"
                    className="bg-orange-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("solution")}
                    sectionId="solution"
                    className="bg-blue-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <CanvasSection
                    section={getSectionById("unique-value-proposition")}
                    sectionId="unique-value-proposition"
                    className="bg-yellow-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("unfair-advantage")}
                    sectionId="unfair-advantage"
                    className="bg-purple-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <CanvasSection
                    section={getSectionById("customer-segments")}
                    sectionId="customer-segments"
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
                    sectionId="key-metrics"
                    className="bg-teal-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-2">
                  <CanvasSection
                    section={getSectionById("channels")}
                    sectionId="channels"
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
                    sectionId="cost-structure"
                    className="bg-red-50"
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onAddItem={addItem}
                  />
                </div>
                <div className="col-span-5">
                  <CanvasSection
                    section={getSectionById("revenue-streams")}
                    sectionId="revenue-streams"
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
        <FloatingChatButton onClick={handleOpenChat} hasUnread={hasUnread} />
      )}

      {/* Sidebar Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CanvasChat
          key={canvasId} // Stable key to preserve chat state updates
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          onMessageUpdate={handleNewMessage}
          canvasId={canvasId}
          canvasState={canvas}
        />
      </div>
    </div>
  );
};

// Main component that provides the canvas context
export default function CanvasEditor() {
  const searchParams = useSearchParams();
  const canvasId = searchParams.get("canvasId") || undefined;

  return (
    <CanvasProvider initialCanvasId={canvasId}>
      <CanvasEditorContent />
    </CanvasProvider>
  );
}
