import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { CanvasStateChange } from "@/contexts/canvas-context";

// Canvas Management Tools
export const canvasUpdateItemTool = createTool({
  id: "canvas_update_item",
  description: "Update a specific item in a canvas section or subsection",
  inputSchema: z.object({
    sectionId: z
      .string()
      .describe(
        "The ID of the canvas section (e.g., 'problem', 'solution', 'customer-segments')"
      ),
    index: z.number().describe("The index of the item to update"),
    value: z.string().describe("The new value for the item"),
    subsectionTitle: z
      .string()
      .optional()
      .describe(
        "Optional: The title of the subsection if updating a subsection item"
      ),
  }),
  outputSchema: z.object({
    changes: z.array(z.any()).describe("Array of CanvasStateChange objects"),
    message: z.string().describe("Description of the action performed"),
  }),
  execute: async ({ context }) => {
    const change: CanvasStateChange = {
      type: "update",
      sectionId: context.sectionId,
      index: context.index,
      value: context.value,
      subsectionTitle: context.subsectionTitle,
      timestamp: Date.now(),
    };

    return {
      changes: [change],
      message: `Updated item at index ${context.index} in section ${
        context.sectionId
      }${
        context.subsectionTitle ? ` subsection ${context.subsectionTitle}` : ""
      } to: "${context.value}"`,
    };
  },
});

export const canvasAddItemTool = createTool({
  id: "canvas_add_item",
  description: "Add a new item to a canvas section or subsection",
  inputSchema: z.object({
    sectionId: z
      .string()
      .describe(
        "The ID of the canvas section (e.g., 'problem', 'solution', 'customer-segments')"
      ),
    subsectionTitle: z
      .string()
      .optional()
      .describe(
        "Optional: The title of the subsection if adding to a subsection"
      ),
  }),
  outputSchema: z.object({
    changes: z.array(z.any()).describe("Array of CanvasStateChange objects"),
    message: z.string().describe("Description of the action performed"),
  }),
  execute: async ({ context }) => {
    const change: CanvasStateChange = {
      type: "add",
      sectionId: context.sectionId,
      subsectionTitle: context.subsectionTitle,
      timestamp: Date.now(),
    };

    return {
      changes: [change],
      message: `Added new item to section ${context.sectionId}${
        context.subsectionTitle ? ` subsection ${context.subsectionTitle}` : ""
      }`,
    };
  },
});

export const canvasRemoveItemTool = createTool({
  id: "canvas_remove_item",
  description: "Remove an item from a canvas section or subsection",
  inputSchema: z.object({
    sectionId: z
      .string()
      .describe(
        "The ID of the canvas section (e.g., 'problem', 'solution', 'customer-segments')"
      ),
    index: z.number().describe("The index of the item to remove"),
    subsectionTitle: z
      .string()
      .optional()
      .describe(
        "Optional: The title of the subsection if removing from a subsection"
      ),
  }),
  outputSchema: z.object({
    changes: z.array(z.any()).describe("Array of CanvasStateChange objects"),
    message: z.string().describe("Description of the action performed"),
  }),
  execute: async ({ context }) => {
    const change: CanvasStateChange = {
      type: "remove",
      sectionId: context.sectionId,
      index: context.index,
      subsectionTitle: context.subsectionTitle,
      timestamp: Date.now(),
    };

    return {
      changes: [change],
      message: `Removed item at index ${context.index} from section ${
        context.sectionId
      }${
        context.subsectionTitle ? ` subsection ${context.subsectionTitle}` : ""
      }`,
    };
  },
});

export const canvasReplaceStateTool = createTool({
  id: "canvas_replace_state",
  description: "Replace the entire canvas state with new content",
  inputSchema: z.object({
    newState: z
      .record(z.any())
      .describe("The complete new canvas state object"),
  }),
  outputSchema: z.object({
    changes: z.array(z.any()).describe("Array of CanvasStateChange objects"),
    message: z.string().describe("Description of the action performed"),
  }),
  execute: async ({ context }) => {
    const change: CanvasStateChange = {
      type: "replace",
      sectionId: "", // Not applicable for replace operation
      newState: context.newState,
      timestamp: Date.now(),
    };

    return {
      changes: [change],
      message: "Replaced entire canvas state with new content",
    };
  },
});

// Canvas Analysis Tool
export const canvasAnalyzeTool = createTool({
  id: "canvas_analyze",
  description: "Analyze the current canvas state and provide insights",
  inputSchema: z.object({
    analysisType: z
      .enum(["completeness", "coherence", "suggestions", "summary"])
      .describe("The type of analysis to perform"),
  }),
  outputSchema: z.object({
    analysisType: z.string().describe("The type of analysis performed"),
    message: z.string().describe("Description of the analysis result"),
  }),
  execute: async ({ context }) => {
    // This tool provides analysis without modifying the canvas
    // The analysis would be based on the canvas state passed via runtime context
    return {
      analysisType: context.analysisType,
      message: `Canvas analysis of type '${context.analysisType}' completed`,
    };
  },
});

// Batch operations
export const canvasBatchUpdateTool = createTool({
  id: "canvas_batch_update",
  description: "Perform multiple canvas operations in a single call",
  inputSchema: z.object({
    operations: z
      .array(
        z.object({
          type: z.enum(["update", "add", "remove", "replace"]),
          sectionId: z.string(),
          index: z.number().optional(),
          value: z.string().optional(),
          subsectionTitle: z.string().optional(),
          newState: z.record(z.any()).optional(),
        })
      )
      .describe("Array of operations to perform"),
  }),
  outputSchema: z.object({
    changes: z.array(z.any()).describe("Array of CanvasStateChange objects"),
    message: z.string().describe("Description of the action performed"),
  }),
  execute: async ({ context }) => {
    const operationSchema = z.object({
      type: z.enum(["update", "add", "remove", "replace"]),
      sectionId: z.string(),
      index: z.number().optional(),
      value: z.string().optional(),
      subsectionTitle: z.string().optional(),
      newState: z.record(z.any()).optional(),
    });

    const changes: CanvasStateChange[] = context.operations.map(
      (op: unknown) => {
        const typedOp = operationSchema.parse(op);
        return {
          type: typedOp.type,
          sectionId: typedOp.sectionId,
          index: typedOp.index,
          value: typedOp.value,
          subsectionTitle: typedOp.subsectionTitle,
          newState: typedOp.newState,
          timestamp: Date.now(),
        };
      }
    );

    const summary = changes
      .map((c) => {
        const target = c.subsectionTitle
          ? `subsection '${c.subsectionTitle}' for section '${c.sectionId}'`
          : `section '${c.sectionId}'`;
        switch (c.type) {
          case "add":
            return `Added '${c.value}' to ${target}`;
          case "update":
            return `Updated item at index ${c.index} in ${target} to '${c.value}'`;
          case "remove":
            return `Removed item at index ${c.index} from ${target}`;
          case "replace":
            return `Replaced entire canvas state`;
          default:
            return `Modified ${target}`;
        }
      })
      .join("; ");

    return {
      changes,
      message: summary || `Performed ${changes.length} canvas operations`,
    };
  },
});

// Export all tools
export const canvasTools = {
  canvasUpdateItemTool,
  canvasAddItemTool,
  canvasRemoveItemTool,
  canvasReplaceStateTool,
  canvasAnalyzeTool,
  canvasBatchUpdateTool,
};
