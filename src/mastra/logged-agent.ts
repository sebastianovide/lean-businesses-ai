import { Agent } from "@mastra/core/agent";
import { AgentConfig } from "@mastra/core/agent";

export class LoggedAgent extends Agent {
  constructor(config: AgentConfig) {
    super(config);
  }

  // @ts-ignore
  override async network(...args: any[]): Promise<any> {
    const messages = args[0];

    // Separate system messages (context) from user messages
    const systemMessages = Array.isArray(messages)
      ? messages.filter((m: any) => m.role === "system")
      : [];
    const userMessages = Array.isArray(messages)
      ? messages.filter((m: any) => m.role !== "system")
      : [];

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Agent: ${this.name}] Starting network request...`);

    if (systemMessages.length > 0) {
      console.log(`\n📋 Context/System Messages (${systemMessages.length}):`);
      systemMessages.forEach((msg: any, idx: number) => {
        const preview = msg.content?.substring(0, 200) || "";
        console.log(
          `  ${idx + 1}. ${preview}${msg.content?.length > 200 ? "..." : ""}`
        );
      });
    }

    if (userMessages.length > 0) {
      console.log(`\n💬 User Messages (${userMessages.length}):`);
      userMessages.slice(-3).forEach((msg: any, idx: number) => {
        console.log(
          `  ${idx + 1}. [${msg.role}]: ${
            msg.content?.substring(0, 100) || ""
          }${msg.content?.length > 100 ? "..." : ""}`
        );
      });
    }
    
    const startTime = Date.now();
    try {
      // @ts-ignore
      const result = await super.network(...args);
      const duration = Date.now() - startTime;
      console.log(
        `\n✅ [Agent: ${this.name}] Network request completed in ${duration}ms`
      );
      console.log(`${"=".repeat(60)}\n`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `\n❌ [Agent: ${this.name}] Network request failed after ${duration}ms:`,
        error
      );
      console.log(`${"=".repeat(60)}\n`);
      throw error;
    }
  }

  // @ts-ignore
  override async stream(...args: any[]): Promise<any> {
    console.log(
      `[Agent: ${this.name}] Starting stream... Input:`,
      JSON.stringify(args[0], null, 2)
    );
    try {
      // @ts-ignore
      const result = await super.stream(...args);
      console.log(
        `[Agent: ${this.name}] Stream started. Result type: ${result?.constructor?.name}`
      );
      // console.log(`[Agent: ${this.name}] Stream result keys: ${Object.keys(result || {})}`);
      return result;
    } catch (error) {
      console.error(`[Agent: ${this.name}] Stream failed:`, error);
      throw error;
    }
  }

  // @ts-ignore
  override async generate(...args: any[]): Promise<any> {
    console.log(
      `[Agent: ${this.name}] Starting generation... Input:`,
      JSON.stringify(args[0], null, 2)
    );
    try {
      // @ts-ignore
      const result = await super.generate(...args);
      console.log(
        `[Agent: ${this.name}] Generation completed. Result:`,
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      console.error(`[Agent: ${this.name}] Generation failed:`, error);
      throw error;
    }
  }
}
