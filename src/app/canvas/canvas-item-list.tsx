import { useRef, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface CanvasItemListProps {
  items: string[];
  sectionId: string;
  subsectionTitle?: string;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  maxItems?: number;
}

export function CanvasItemList({
  items,
  sectionId,
  subsectionTitle,
  onUpdate,
  onRemove,
  onAdd,
  maxItems = 3,
}: CanvasItemListProps) {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const shouldFocusLastItem = useRef(false);

  // Local state to track which item is being edited (for selection behavior)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (shouldFocusLastItem.current && items.length > 0) {
      const lastIndex = items.length - 1;
      const el = inputRefs.current[lastIndex];
      if (el) {
        el.focus();
        el.select();
      }
      shouldFocusLastItem.current = false;
    }
  }, [items.length]);

  const handleAdd = () => {
    shouldFocusLastItem.current = true;
    onAdd();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 group min-w-0 overflow-x-hidden"
        >
          <input
            type="text"
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            value={item}
            onFocus={(e) => {
              setEditingIndex(index);
              // If this is a new empty item (and we just focused it via code), select all
              // But the useEffect above handles the "Add" case.
              // This is for user clicking on it.
              if (item === "") {
                // Optional: select all if empty?
              }
            }}
            onBlur={() => setEditingIndex(null)}
            onKeyDown={handleKeyDown}
            onChange={(e) => onUpdate(index, e.target.value)}
            className="w-full max-w-[calc(100%-32px)] px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset focus:border-blue-500 truncate"
            placeholder="Enter item..."
          />
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-red-500 hover:text-red-700 shrink-0"
          >
            <Minus size={12} />
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      )}
    </div>
  );
}
