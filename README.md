# AI Streaming Hackathon Guide

This project serves as a rough-and-ready guide for hackathon participants by demonstrating how to stream LLM responses from a BAML-powered backend to a Vite-based frontend UI, using Express for the server.

The API exposes a generic endpoint at `/baml/stream/:fn` that can be called with the name of your exported BAML function as well as an `args` param, the value of which is a stringified and escaped object representing your args. This is to enable you to rapidly add new functions with new arguments quickly without refactoring the server. It is not, however, type safe so in production you'd normally call `b.ExtractResume` explicitly for example.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn (this guide will use pnpm as an example)

You will also need an OpenAI API key.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    This project uses pnpm for package management.
    ```bash
    pnpm install
    ```
    If you prefer npm or yarn:
    ```bash
    # Using npm
    npm install

    # Using yarn
    yarn install
    ```

3.  **Set up environment variables:**
    
    Set up your API key by running this in the terminal session your server will run:

    ```bash
    export OPENAI_API_KEY="your_openai_api_key_here"
    ```
    The backend server also uses `BAML_SERVER_PORT`, which defaults to `3002` if not set. You can override it in the `.env` file if needed:
    ```env
    BAML_SERVER_PORT=3003
    ```

4.  **Generate BAML client:**
    Before running the application, you might need to generate the BAML client based on your BAML source files (`baml_src/`).
    ```bash
    pnpm baml:generate
    ```


## Running the Application

You'll need to run two separate processes: the backend server and the frontend development server.

1.  **Start the Backend Server:**
    Open a terminal and run:
    ```bash
    pnpm dev:server
    ```
    This will start the Express server (defaults to `http://localhost:3002`). The server handles BAML function calls and streams responses.

2.  **Start the Frontend Development Server:**
    In a separate terminal, run:
    ```bash
    pnpm dev:frontend
    ```
    This will start the Vite development server (usually on `http://localhost:5173` or the next available port).

Once both servers are running, you can open your browser to the address provided by the Vite development server to see the application in action.

## Key Components

-   **BAML (`baml_src/`, `baml_client/`):** Defines the AI functions and handles the logic for interacting with language models. The generated `baml_client` is used by the server to call these functions.
-   **Express (`src/server/index.ts`):** Provides the backend API endpoints. The key endpoint is `/baml/stream/:fn`, which takes a BAML function name (`fn`) and arguments, and streams the partial responses back to the client using Server-Sent Events (SSE).
-   **Vite + React (`src/` (non-server parts), `index.html`):** Powers the frontend user interface. It will make requests to the Express server to invoke BAML functions and display the streaming data.

## How Streaming Works

The backend server (`src/server/index.ts`) exposes a generic endpoint `/baml/stream/:fn` (available via both GET and POST).
-   When a request hits this endpoint, the server uses the `BamlStream` from the `@boundaryml/baml` library to call the specified BAML function (`:fn`) with the provided arguments.
-   It then iterates over the stream of partial results. Each partial result is sent to the client as a Server-Sent Event (SSE).
-   The frontend client will listen to these SSE events to update the UI in real-time as data arrives.
-   Once the stream is complete, a final event with the complete response can also be sent.

This setup allows for a responsive user experience, as users don't have to wait for the entire AI response to complete before seeing results.

## Debugging

I've found it sometimes doesn't work in Brave for reasons I've not had time to debug. Chrome does appear to work however.