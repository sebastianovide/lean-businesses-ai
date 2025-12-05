import { CanvasSection as CanvasSectionData } from "./types";
import { CanvasItemList } from "./canvas-item-list";

interface CanvasSectionProps {
  section: CanvasSectionData;
  className?: string;
  onUpdateItem: (
    sectionId: string,
    index: number,
    value: string,
    subsectionTitle?: string
  ) => void;
  onRemoveItem: (
    sectionId: string,
    index: number,
    subsectionTitle?: string
  ) => void;
  onAddItem: (sectionId: string, subsectionTitle?: string) => void;
}

export function CanvasSection({
  section,
  className = "",
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: CanvasSectionProps) {
  return (
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
                  <CanvasItemList
                    items={subsection.items}
                    sectionId={section.id}
                    subsectionTitle={subsection.title}
                    onUpdate={(index, value) =>
                      onUpdateItem(section.id, index, value, subsection.title)
                    }
                    onRemove={(index) =>
                      onRemoveItem(section.id, index, subsection.title)
                    }
                    onAdd={() => onAddItem(section.id, subsection.title)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CanvasItemList
            items={section.items || []}
            sectionId={section.id}
            onUpdate={(index, value) =>
              onUpdateItem(section.id, index, value)
            }
            onRemove={(index) => onRemoveItem(section.id, index)}
            onAdd={() => onAddItem(section.id)}
          />
        )}
      </div>
    </div>
  );
}
