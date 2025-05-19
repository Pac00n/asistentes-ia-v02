// app/api/chat-direct/route.ts
import { NextResponse } from "next/server";
import { Assistant, getAssistantById } from "@/lib/assistants";
import { mcpManager } from "@/lib/mcp-client";
import OpenAI from 'openai';

export const runtime = "nodejs";
export const maxDuration = 60; // Changed from 180

async function handleMCPToolCallsDirect(
  toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[]
): Promise<OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]> {
  const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];
  console.log(`[API Chat Direct] [MCP] Handling ${toolCalls.length} tool call(s)`);

  for (const toolCall of toolCalls) {
    const { id: toolCallId, function: func } = toolCall;
    const { name: openaiFunctionName, arguments: functionArgs } = func;
    let output: any;
    let serverKey: string | undefined;
    let toolName: string | undefined;

    try {
      console.log(`[API Chat Direct] [MCP] Received OpenAI tool call: ${openaiFunctionName}, Args: ${functionArgs}`);
      
      const mcpFunctionName = openaiFunctionName.replace('_', '.');
      const parts = mcpFunctionName.split('.');
      serverKey = parts[0];
      toolName = parts.slice(1).join('.');

      if (!serverKey || !toolName || !mcpFunctionName.includes('.')) {
        console.error(`[API Chat Direct] [MCP] Failed to parse serverKey and toolName from function: ${openaiFunctionName} (converted to ${mcpFunctionName})`);
        throw new Error(`Invalid function name format for MCP: ${openaiFunctionName}. Expected 'serverKey_toolName' from OpenAI.`);
      }
      console.log(`[API Chat Direct] [MCP] OpenAI function '${openaiFunctionName}' converted to MCP '${mcpFunctionName}' (Server: ${serverKey}, Tool: ${toolName})`);

      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(functionArgs);
      } catch (e: any) {
        throw new Error(`Error parsing arguments for ${openaiFunctionName}: ${e.message}`);
      }

      const result = await mcpManager.executeTool(serverKey, toolName, parsedArgs);
      output = JSON.stringify(result);
      console.log(`[API Chat Direct] [MCP] Tool ${openaiFunctionName} (-> ${mcpFunctionName}) executed. Result: ${output.substring(0,100)}...`);

    } catch (error: any) {
      console.error(`[API Chat Direct] [MCP] Error executing tool ${openaiFunctionName} (-> ${serverKey}.${toolName}):`, error);
      output = JSON.stringify({ error: error.message || "Unknown error during MCP tool execution" });
    }
    toolOutputs.push({ tool_call_id: toolCallId, output });
  }
  return toolOutputs;
}

export async function POST(req: Request) {
  console.log("[API Chat Direct] Received POST request /api/chat-direct");
  try {
    const { assistantId, message, threadId: existingThreadId } = await req.json();

    if (!assistantId || !message) {
      return NextResponse.json({ error: "assistantId and message are required" }, { status: 400 });
    }

    const assistantConfig: Assistant | undefined = getAssistantById(assistantId);
    if (!assistantConfig || !assistantConfig.assistant_id) {
      const errorMsg = !assistantConfig ? 'Assistant not found' : `Invalid configuration for ${assistantId}: missing OpenAI assistant_id.`;
      console.error(`[API Chat Direct] Invalid assistant configuration: ${errorMsg}`);
      return NextResponse.json({ error: errorMsg }, { status: !assistantConfig ? 404 : 500 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[API Chat Direct] OpenAI API key not configured.");
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    if (assistantConfig.mcpTools && assistantConfig.mcpTools.length > 0) {
      console.log(`[API Chat Direct] [MCP] Assistant ${assistantId} uses MCP tools: ${assistantConfig.mcpTools.join(', ')}`);
      const initialized = await mcpManager.initialize();
      if (initialized) {
        for (const serverKey of assistantConfig.mcpTools) {
          await mcpManager.connectToServer(serverKey);
        }
      } else {
        console.error("[API Chat Direct] [MCP] MCP Manager failed to initialize. MCP tools may not be available.");
      }
    } else {
      console.log(`[API Chat Direct] Assistant ${assistantId} does not use MCP tools.`);
    }

    const openaiAssistantId = assistantConfig.assistant_id;
    const baseUrl = "https://api.openai.com/v1";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };

    let currentThreadId = existingThreadId;

    if (!currentThreadId) {
      const threadRes = await fetch(`${baseUrl}/threads`, { method: "POST", headers });
      if (!threadRes.ok) {
        const errText = await threadRes.text();
        console.error("[API Chat Direct] Error creating thread:", errText);
        throw new Error(`Error creating thread: ${threadRes.statusText} - ${errText}`);
      }
      const threadData = await threadRes.json();
      currentThreadId = threadData.id;
      console.log(`[API Chat Direct] New thread created: ${currentThreadId}`);
    } else {
      console.log(`[API Chat Direct] Using existing thread: ${currentThreadId}`);
    }

    const msgBody = { role: "user", content: message };
    const msgRes = await fetch(`${baseUrl}/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(msgBody),
    });
    if (!msgRes.ok) {
      const errText = await msgRes.text();
      console.error("[API Chat Direct] Error sending message:", errText);
      throw new Error(`Error sending message: ${msgRes.statusText} - ${errText}`);
    }
    console.log(`[API Chat Direct] Message added to thread: ${message.substring(0,50)}...`);

    console.log(`[API Chat Direct] Creating Run with Assistant ID: ${openaiAssistantId}`);
    let runRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: openaiAssistantId }),
    });
    if (!runRes.ok) {
      const errText = await runRes.text();
      console.error("[API Chat Direct] Error creating run:", errText);
      throw new Error(`Error creating run: ${runRes.statusText} - ${errText}`);
    }
    let runData = await runRes.json();
    const runId = runData.id;
    console.log(`[API Chat Direct] Run created: ${runId}, Initial Status: ${runData.status}`);

    let status = runData.status;
    let attempts = 0;
    const maxAttempts = 90; // This might be too long if maxDuration is 60s

    while (["queued", "in_progress", "requires_action", "cancelling"].includes(status) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      attempts++;

      console.log(`[API Chat Direct] Polling run status (Attempt ${attempts}/${maxAttempts}). Run ID: ${runId}, Current Status: ${status}`);
      const statusRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs/${runId}`, { headers });
      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("[API Chat Direct] Error fetching run status:", errText);
        throw new Error(`Error fetching run status: ${statusRes.statusText} - ${errText}`);
      }
      runData = await statusRes.json();
      status = runData.status;
      console.log(`[API Chat Direct] Run status: ${status}`);

      if (status === "requires_action") {
        if (runData.required_action?.type === "submit_tool_outputs" && 
            runData.required_action.submit_tool_outputs?.tool_calls) {
          
          const toolCalls = runData.required_action.submit_tool_outputs.tool_calls;
          console.log(`[API Chat Direct] [MCP] ${toolCalls.length} tool call(s) required by OpenAI.`);
          
          const toolOutputs = await handleMCPToolCallsDirect(toolCalls);
          
          console.log(`[API Chat Direct] [MCP] Submitting ${toolOutputs.length} tool output(s) to OpenAI run ${runId}.`);
          const submitRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs/${runId}/submit_tool_outputs`, {
            method: "POST",
            headers,
            body: JSON.stringify({ tool_outputs: toolOutputs }),
          });

          if (!submitRes.ok) {
            const errText = await submitRes.text();
            console.error("[API Chat Direct] [MCP] Error submitting tool outputs:", errText);
            throw new Error(`Error submitting tool outputs: ${submitRes.statusText} - ${errText}`);
          }
          console.log(`[API Chat Direct] [MCP] Tool outputs submitted. Run status should update from requires_action.`);
        } else {
          console.warn(`[API Chat Direct] Unhandled requires_action type: ${runData.required_action?.type}`);
          return NextResponse.json({ error: "Assistant requires unhandled actions.", details: runData.required_action }, { status: 501 });
        }
      }
    }

    if (status !== "completed") {
      console.error(`[API Chat Direct] Run did not complete. Final status: ${status}. Run data:`, runData);
      let errorMessage = `Assistant run failed to complete. Status: ${status}.`;
      if (runData.last_error) {
        errorMessage += ` Error: ${runData.last_error.message} (Code: ${runData.last_error.code})`;
      }
      return NextResponse.json({ error: errorMessage, details: runData }, { status: 500 });
    }

    console.log(`[API Chat Direct] Run ${runId} completed. Fetching messages...`);
    const messagesRes = await fetch(`${baseUrl}/threads/${currentThreadId}/messages?order=desc&limit=10`, { headers });
    if (!messagesRes.ok) {
      const errText = await messagesRes.text();
      console.error("[API Chat Direct] Error fetching messages:", errText);
      throw new Error(`Error fetching messages: ${messagesRes.statusText} - ${errText}`);
    }
    const messagesData = await messagesRes.json();

    if (!messagesData.data || messagesData.data.length === 0) {
      console.error("[API Chat Direct] No messages found in the thread after run completion.");
      throw new Error("No messages found in the thread after run completion.");
    }

    const assistantMessage = messagesData.data.find(
      (msg: any) => msg.role === "assistant" && msg.run_id === runId
    );

    if (!assistantMessage) {
      console.error("[API Chat Direct] No assistant message found for this run.", messagesData.data);
      throw new Error("No assistant message found for this run.");
    }

    let assistantReply = "Assistant did not provide a text response.";
    if (assistantMessage.content && assistantMessage.content.length > 0) {
      const textContent = assistantMessage.content.find((content: any) => content.type === "text");
      if (textContent && textContent.text && textContent.text.value) {
        assistantReply = textContent.text.value;
      }
    }

    console.log("[API Chat Direct] Assistant Reply:", assistantReply.substring(0,100) + "...");
    return NextResponse.json({ reply: assistantReply, threadId: currentThreadId });

  } catch (error: any) {
    console.error("[API Chat Direct] Unhandled general error in POST /api/chat-direct:", error);
    return NextResponse.json(
      { 
        error: "Internal server error processing chat request.", 
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
