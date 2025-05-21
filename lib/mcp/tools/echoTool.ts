// lib/mcp/tools/echoTool.ts
import { z } from "zod"; // Assuming z is used for consistency, though not strictly needed for this simple schema

// Define the schema for parameters (OpenAI format)
const echoParameters = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "The message to be echoed.",
    },
  },
  required: ["message"],
};

export const echoTool = {
  meta: {
    name: "echo_message",
    description: "Echoes back the provided message. Useful for testing tool integration.",
    parameters: echoParameters,
  },
  async run({ message }: { message: string }) {
    try {
      if (typeof message !== 'string') {
        throw new Error("Invalid input: message must be a string.");
      }
      return {
        original_message: message,
        echoed_at: new Date().toISOString(),
        status: "success",
      };
    } catch (error) {
      console.error("Error in echo_message tool:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error in echo tool",
        status: "error",
      };
    }
  },
};
