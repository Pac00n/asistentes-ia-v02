"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.echoTool = void 0;
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
exports.echoTool = {
    meta: {
        name: "echo_message",
        description: "Echoes back the provided message. Useful for testing tool integration.",
        parameters: echoParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ message }) {
            try {
                if (typeof message !== 'string') {
                    throw new Error("Invalid input: message must be a string.");
                }
                return {
                    original_message: message,
                    echoed_at: new Date().toISOString(),
                    status: "success",
                };
            }
            catch (error) {
                console.error("Error in echo_message tool:", error);
                return {
                    error: error instanceof Error ? error.message : "Unknown error in echo tool",
                    status: "error",
                };
            }
        });
    },
};
