import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

export const storage = new LibSQLStore({
  url: "file:../mastra.db", // path is relative to the .mastra/output directory
});

export const memory = new Memory({
  storage,
  options: {
    workingMemory: {
      enabled: true,
      scope: "thread", // Canvas state is per-thread (per canvasId)
    },
  },
});
