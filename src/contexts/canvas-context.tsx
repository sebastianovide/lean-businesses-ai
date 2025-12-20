"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { CanvasState, CanvasStorage } from "@/app/canvas/types";
import { v4 as uuidv4 } from "uuid";

interface CanvasContextType {
  // State
  canvasId: string;
  canvasName: string;
  canvas: CanvasState;
  hasLoadedFromStorage: boolean;

  // Actions
  setCanvasId: (id: string) => void;
  setCanvasName: (name: string) => void;
  updateCanvas: (newCanvas: CanvasState) => void;
  updateItem: (
    sectionId: string,
    index: number,
    value: string,
    subsectionTitle?: string
  ) => void;
  addItem: (
    sectionId: string,
    subsectionTitle?: string,
    value?: string
  ) => void;
  removeItem: (
    sectionId: string,
    index: number,
    subsectionTitle?: string
  ) => void;
  clearCanvas: () => void;
  loadFromStorage: (storageData: CanvasStorage) => void;
  saveToStorage: () => void;

  // Tool state management
  applyToolChanges: (changes: CanvasStateChange[]) => void;
  pendingToolChanges: CanvasStateChange[];
  clearPendingChanges: () => void;
}

export interface CanvasStateChange {
  type: "update" | "add" | "remove" | "replace";
  sectionId: string;
  index?: number;
  subsectionTitle?: string;
  value?: string;
  newState?: CanvasState;
  timestamp: number;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
};

interface CanvasProviderProps {
  children: ReactNode;
  initialCanvasId?: string;
  initialCanvas?: CanvasState;
}

export const CanvasProvider = ({
  children,
  initialCanvasId,
  initialCanvas,
}: CanvasProviderProps) => {
  const [canvasId, setCanvasId] = useState<string>(initialCanvasId || uuidv4());
  const [canvasName, setCanvasName] = useState<string>("Untitled Canvas");
  const [canvas, setCanvas] = useState<CanvasState>(
    initialCanvas || getInitialCanvas()
  );
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [pendingToolChanges, setPendingToolChanges] = useState<
    CanvasStateChange[]
  >([]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save functionality
  const saveToStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const storageData = localStorage.getItem("lean-canvases-storage");
      const canvasStorage: CanvasStorage = storageData
        ? JSON.parse(storageData)
        : {};

      const now = new Date().toISOString();

      if (canvasStorage[canvasId]) {
        canvasStorage[canvasId] = {
          ...canvasStorage[canvasId],
          state: canvas,
          name: canvasName,
          updatedAt: now,
        };
      } else {
        canvasStorage[canvasId] = {
          state: canvas,
          name: canvasName,
          createdAt: now,
          updatedAt: now,
        };
      }

      localStorage.setItem(
        "lean-canvases-storage",
        JSON.stringify(canvasStorage)
      );
    } catch (err) {
      console.error("Failed to save canvas to storage:", err);
    }
  }, [canvasId, canvas, canvasName]);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveToStorage, 500);
  }, [saveToStorage]);

  // Canvas operations
  const updateCanvas = useCallback((newCanvas: CanvasState) => {
    setCanvas(newCanvas);
  }, []);

  // Helper to find subsection key by title (case-insensitive)
  const findSubsectionKey = (
    subsections: Record<string, { title: string; items?: string[] }>,
    title: string
  ) => {
    // 1. Try direct match
    if (subsections[title]) return title;

    // 2. Try lowercase match
    const lowerTitle = title.toLowerCase();
    if (subsections[lowerTitle]) return lowerTitle;

    // 3. Try to match by title property
    const foundKey = Object.keys(subsections).find(
      (key) => subsections[key].title.toLowerCase() === lowerTitle
    );
    if (foundKey) return foundKey;

    // 4. Try kebab-case (simple version)
    const kebabTitle = lowerTitle.replace(/\s+/g, "-");
    if (subsections[kebabTitle]) return kebabTitle;

    return null;
  };

  // Internal helper to resolve section and subsection
  const resolveSection = useCallback(
    (sectionId: string, subsectionTitle?: string) => {
      // 1. Try top-level sectionId
      if (canvas[sectionId]) {
        return {
          resolvedSectionId: sectionId,
          resolvedSubsectionTitle: subsectionTitle,
        };
      }

      // 2. Search for section title or subsection ID/title
      for (const [sId, section] of Object.entries(canvas)) {
        if (section.title.toLowerCase() === sectionId.toLowerCase()) {
          return {
            resolvedSectionId: sId,
            resolvedSubsectionTitle: subsectionTitle,
          };
        }
        if (section.subsections) {
          const subKey = findSubsectionKey(section.subsections, sectionId);
          if (subKey) {
            return {
              resolvedSectionId: sId,
              resolvedSubsectionTitle: subKey,
            };
          }
        }
      }

      return {
        resolvedSectionId: sectionId,
        resolvedSubsectionTitle: subsectionTitle,
      };
    },
    [canvas]
  );

  const updateItem = useCallback(
    (
      sectionId: string,
      index: number,
      value: string,
      subsectionTitle?: string
    ) => {
      const { resolvedSectionId, resolvedSubsectionTitle } = resolveSection(
        sectionId,
        subsectionTitle
      );

      setCanvas((prev) => {
        const section = prev[resolvedSectionId];
        if (!section) return prev;

        // Determine effective subsection title
        let effectiveSubsectionTitle = resolvedSubsectionTitle;
        if (!effectiveSubsectionTitle && section.subsections) {
          effectiveSubsectionTitle = resolvedSectionId;
        }

        if (effectiveSubsectionTitle && section.subsections) {
          const updatedSubsections = { ...section.subsections };
          const subsectionKey = findSubsectionKey(
            updatedSubsections,
            effectiveSubsectionTitle
          );
          if (subsectionKey) {
            const subsection = updatedSubsections[subsectionKey];
            if (subsection && subsection.items) {
              const newItems = [...subsection.items];
              if (index >= newItems.length) {
                newItems[index] = value;
              } else {
                newItems[index] = value;
              }

              updatedSubsections[subsectionKey] = {
                ...subsection,
                items: newItems,
              };
            }
          }
          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              subsections: updatedSubsections,
            },
          };
        } else if (!effectiveSubsectionTitle) {
          const newItems = section.items ? [...section.items] : [];
          if (index >= newItems.length) {
            newItems[index] = value;
          } else {
            newItems[index] = value;
          }

          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              items: newItems,
            },
          };
        }
        return prev;
      });
    },
    [resolveSection]
  );

  const addItem = useCallback(
    (sectionId: string, subsectionTitle?: string, value: string = "") => {
      const { resolvedSectionId, resolvedSubsectionTitle } = resolveSection(
        sectionId,
        subsectionTitle
      );

      setCanvas((prev) => {
        const section = prev[resolvedSectionId];
        if (!section) return prev;

        // Determine effective subsection title
        let effectiveSubsectionTitle = resolvedSubsectionTitle;
        if (!effectiveSubsectionTitle && section.subsections) {
          effectiveSubsectionTitle = resolvedSectionId;
        }

        if (effectiveSubsectionTitle && section.subsections) {
          const updatedSubsections = { ...section.subsections };
          const subsectionKey = findSubsectionKey(
            updatedSubsections,
            effectiveSubsectionTitle
          );

          if (subsectionKey) {
            const subsection = updatedSubsections[subsectionKey];
            if (subsection && subsection.items && subsection.items.length < 3) {
              updatedSubsections[subsectionKey] = {
                ...subsection,
                items: [...subsection.items, value],
              };
            }
          }
          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              subsections: updatedSubsections,
            },
          };
        } else if (
          !effectiveSubsectionTitle &&
          section.items &&
          section.items.length < 3
        ) {
          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              items: [...section.items, value],
            },
          };
        }
        return prev;
      });
    },
    [resolveSection]
  );

  const removeItem = useCallback(
    (sectionId: string, index: number, subsectionTitle?: string) => {
      const { resolvedSectionId, resolvedSubsectionTitle } = resolveSection(
        sectionId,
        subsectionTitle
      );

      setCanvas((prev) => {
        const section = prev[resolvedSectionId];
        if (!section) return prev;

        // Determine effective subsection title
        let effectiveSubsectionTitle = resolvedSubsectionTitle;
        if (!effectiveSubsectionTitle && section.subsections) {
          effectiveSubsectionTitle = resolvedSectionId;
        }

        if (effectiveSubsectionTitle && section.subsections) {
          const updatedSubsections = { ...section.subsections };
          const subsectionKey = findSubsectionKey(
            updatedSubsections,
            effectiveSubsectionTitle
          );

          if (subsectionKey) {
            const subsection = updatedSubsections[subsectionKey];
            if (subsection && subsection.items) {
              updatedSubsections[subsectionKey] = {
                ...subsection,
                items: subsection.items.filter((_, i) => i !== index),
              };
            }
          }
          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              subsections: updatedSubsections,
            },
          };
        } else if (!effectiveSubsectionTitle) {
          return {
            ...prev,
            [resolvedSectionId]: {
              ...section,
              items: section.items?.filter((_, i) => i !== index),
            },
          };
        }
        return prev;
      });
    },
    [resolveSection]
  );

  const clearCanvas = useCallback(() => {
    setCanvas(getInitialCanvas());
    setCanvasName("Untitled Canvas");
    setPendingToolChanges([]);
  }, []);

  const loadFromStorage = useCallback(
    (storageData: CanvasStorage) => {
      const storedCanvas = storageData[canvasId];
      if (storedCanvas) {
        setCanvas(storedCanvas.state);
        setCanvasName(storedCanvas.name);
      }
      setHasLoadedFromStorage(true);
    },
    [canvasId]
  );

  // Tool integration
  const applyToolChanges = useCallback(
    (changes: CanvasStateChange[]) => {
      setPendingToolChanges(changes);

      // Apply changes immediately
      changes.forEach((change) => {
        switch (change.type) {
          case "update":
            if (
              change.sectionId &&
              change.index !== undefined &&
              change.value !== undefined
            ) {
              updateItem(
                change.sectionId,
                change.index,
                change.value,
                change.subsectionTitle
              );
            }
            break;
          case "add":
            if (change.sectionId) {
              addItem(change.sectionId, change.subsectionTitle, change.value);
            }
            break;
          case "remove":
            if (change.sectionId && change.index !== undefined) {
              removeItem(
                change.sectionId,
                change.index,
                change.subsectionTitle
              );
            }
            break;
          case "replace":
            if (change.newState) {
              setCanvas(change.newState);
            }
            break;
        }
      });
    },
    [updateItem, addItem, removeItem]
  );

  const clearPendingChanges = useCallback(() => {
    setPendingToolChanges([]);
  }, []);

  // Auto-save when canvas changes
  useEffect(() => {
    if (hasLoadedFromStorage) {
      scheduleSave();
    }
  }, [canvas, canvasName, scheduleSave, hasLoadedFromStorage]);

  const contextValue: CanvasContextType = {
    canvasId,
    canvasName,
    canvas,
    hasLoadedFromStorage,
    setCanvasId,
    setCanvasName,
    updateCanvas,
    updateItem,
    addItem,
    removeItem,
    clearCanvas,
    loadFromStorage,
    saveToStorage,
    applyToolChanges,
    pendingToolChanges,
    clearPendingChanges,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

// Helper function for initial canvas state
function getInitialCanvas(): CanvasState {
  return {
    problem: {
      order: 2,
      title: "Problem",
      subsections: {
        problem: { title: "Problem", items: [] },
        "existing-alternatives": { title: "Existing Alternatives", items: [] },
      },
    },
    solution: {
      order: 4,
      title: "Solution",
      items: [],
    },
    "key-metrics": {
      order: 8,
      title: "Key Metrics",
      items: [],
    },
    "unique-value-proposition": {
      order: 3,
      title: "Unique Value Proposition",
      subsections: {
        "unique-value-proposition": {
          title: "Unique Value Proposition",
          items: [],
        },
        "high-level-concept": {
          title: "High Level Concept",
          items: [],
        },
      },
    },
    "unfair-advantage": {
      order: 9,
      title: "Unfair Advantage",
      items: [],
    },
    channels: {
      order: 5,
      title: "Channels",
      items: [],
    },
    "customer-segments": {
      order: 1,
      title: "Customer Segments",
      subsections: {
        "customer-segments": {
          title: "Customer Segments",
          items: [],
        },
        "early-adopter": {
          title: "Early Adopter",
          items: [],
        },
      },
    },
    "cost-structure": {
      order: 7,
      title: "Cost Structure",
      items: [],
    },
    "revenue-streams": {
      order: 6,
      title: "Revenue Streams",
      items: [],
    },
  };
}
