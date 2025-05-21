# Openai chat integration

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pac0ns-projects/v0-openai-chat-integration)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/pYtnwg5tmpe)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/pac0ns-projects/v0-openai-chat-integration](https://vercel.com/pac0ns-projects/v0-openai-chat-integration)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/pYtnwg5tmpe](https://v0.dev/chat/projects/pYtnwg5tmpe)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

---

## Project Features

This project includes several chat interfaces and backend functionalities.

### Standard Chat (OpenAI Assistants API)
- **UI Path**: `/chat-v3/[assistantId]`
- **API Route**: `/api/chat`
- **Description**: This chat interface uses the OpenAI Assistants API to provide responses. It supports different assistants based on the `assistantId` URL parameter.

### Chat MCP v3 (Local Tools)
- **UI Path**: `/chat-v3/mcp-v3` (accessed via the main page by selecting "MCP v3")
- **API Route**: `/api/chat/mcp`
- **Description**: This version of the chat client (MCP - Multi-Capability Processor) integrates with a local tool registry (`lib/mcp/registry.ts`). Tools like a calculator, currency converter, weather, news, and search are defined locally and executed by the backend. OpenAI's function calling capability is used to determine when to use these tools.

### Chat MCP v4 (External Tools via McpClient)
- **UI Path**: `/chat/mcpv4/[assistantId]` (e.g., `/chat/mcpv4/mcp-v4-tools`)
- **API Route**: `/api/chat/mcpv4`
- **Description**: This is the latest iteration of the MCP chat. It introduces the `McpClient` (`lib/mcp/client.ts`) which is designed to connect to **external MCP-compliant tool servers**. Instead of a local registry, `McpClient` discovers and executes tools hosted on these external servers. This allows for a more scalable and microservice-oriented architecture for tool provision.
- **Tool Naming**: Tool names from external servers are prefixed with the server's `id` (e.g., `server1_calculator`).

#### Configuration for Chat MCP v4 (External Servers)

To use the Chat MCP v4 with external tool servers, you need to configure the `McpClient` via the `MCP_SERVERS_CONFIG` environment variable.

- **Variable Name**: `MCP_SERVERS_CONFIG`
- **Format**: A JSON string representing an array of `McpServerConfig` objects.
- **`McpServerConfig` Object Fields**:
    - `id` (string, required): A unique identifier for the server. This ID will be used to prefix tool names from this server (e.g., `id: "srv1"` results in tools like `srv1_someTool`).
    - `url` (string, required): The base URL of the MCP-compliant tool server. `McpClient` will attempt to discover tools at `<url>/tools` (GET) and execute them at `<url>` (POST).
    - `name` (string, optional): A human-readable name for the server (used in logs).
    - `apiKey` (string, optional): An API key if the external server requires authentication. This key would be sent in the `X-API-Key` header by the `McpClient` if HTTP calls were fully implemented.

- **Example `MCP_SERVERS_CONFIG`**:
  ```json
  [
    {
      "id": "weather_service",
      "url": "https://my-weather-tool-server.com/api",
      "name": "Weather Service Provider",
      "apiKey": "your_api_key_for_weather_service"
    },
    {
      "id": "calculator_srv",
      "url": "http://localhost:3001/mcp",
      "name": "Local Calculator Server"
    }
  ]
  ```

- **Setting the Environment Variable**:
  You can set this variable in your deployment environment (e.g., Vercel environment variables) or locally in a `.env.local` file:
  ```env
  MCP_SERVERS_CONFIG='[{"id":"weather_service","url":"https://my-weather-tool-server.com/api","name":"Weather Service Provider","apiKey":"your_api_key_for_weather_service"},{"id":"calculator_srv","url":"http://localhost:3001/mcp","name":"Local Calculator Server"}]'
  ```
  **Note**: Ensure the JSON is a valid, minified string when setting it as an environment variable, especially in `.env` files or platform configurations.

#### Current Limitations for Chat MCP v4

-   **Simulated HTTP Calls**: The `McpClient` (`lib/mcp/client.ts`) currently **simulates** the HTTP calls (GET to `/tools` for discovery, POST to server URL for execution) to external MCP servers. The actual `fetch` calls are commented out.
    -   **Discovery Simulation**: Tool discovery is based on hardcoded examples within `McpClient.ts` (reacting to `server.id` like "srv1", "toolCo", "srvNoTools"). If `MCP_SERVERS_CONFIG` includes servers with other IDs, `McpClient` will attempt to "discover" from them but will find no tools unless its internal simulation is updated.
    -   **Execution Simulation**: Tool execution also returns hardcoded results based on `server.id` and `originalToolName` matching those in the discovery simulation.
-   **Implementation Status**: This means that while the framework for connecting to external tool servers is in place, it **does not yet perform real network requests** to these servers. Developers wishing to use this with actual external servers will need to:
    1.  Uncomment the `fetch` calls (or replace with `axios`, etc.) in `McpClient.ts` within the `discoverToolsFromServer` and `executeTool` methods.
    2.  Remove or adapt the current simulation logic within those methods.
    3.  Thoroughly test these live integrations.
-   **Error Handling**: Basic error handling for the simulated network requests and data parsing is included but may need to be enhanced for production use with real servers (e.g., more specific error types, retry mechanisms).

This setup allows for local testing and development of the MCP v4 flow without needing live external tool servers, but it's a critical point to understand for anyone trying to deploy or extend this functionality.

---

## Development

To run this project locally:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set up your environment variables:
    *   Create a `.env.local` file in the root of the project.
    *   Add your OpenAI API key: `NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here`
    *   Optionally, for Chat MCP v4, add `MCP_SERVERS_CONFIG` as described above if you intend to modify/test that functionality (keeping in mind the simulation).
4.  Run the development server: `npm run dev`
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests
The project includes unit and integration tests using Jest.
- Run all tests: `npm test` (executes `jest`)
- Run unit tests for `McpClient`: `npx jest tests/unit/mcpClient.test.ts`
- Run integration tests for MCPv4 API: `npx jest tests/integration/mcpv4Api.test.ts`

Ensure Jest is configured (`jest.config.js`) and dependencies are installed (`npm install`).