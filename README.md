# PS-22 Proactive Digital Engagement Agent

A full-stack, customer-selectable proactive engagement prototype.

## What this version does

- Loads every customer from `data/PS22_dataset.xlsx` into SQLite on first backend startup.
- Does **not** seed predefined demo customers or scenario buttons.
- Lets you select/search any customer from Customer Explorer.
- Runs the same multi-agent pipeline for the selected customer.
- Uses Groq for cautious need inference and message generation when configured.
- Uses deterministic rules for signal derivation, channel selection, consent/suppression and escalation.
- Stores generated AI decisions, escalation cases and audit logs in SQLite.
- Dashboard and analytics use database records rather than hard-coded demo metrics.

## Project layout

```text
ps22-proactive-agent/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── data/
│   └── PS22_dataset.xlsx
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vercel.json
│   └── Dockerfile
├── render.yaml
├── .dockerignore
└── docker-compose.yml
```

## 1. Backend setup (Windows PowerShell)

Open a terminal in the project root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell says script execution is disabled, use Command Prompt instead:

```cmd
.venv\Scripts\activate.bat
```

## 2. Configure Groq

Inside `backend`, copy `.env.example` to `.env` and set your key:

```env
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_GROQ_API_KEY
MODEL_NAME=openai/gpt-oss-120b
DATABASE_URL=sqlite:///./ps22.db
```

`DATABASE_URL=sqlite:///./ps22.db` means: create/use a local SQLite file named `ps22.db` in the backend working directory. You do not need to create this file yourself.

Never commit your real API key.

## 3. Start the backend

From `backend`:

```powershell
uvicorn app.main:app --reload --port 8000
```

On startup the application imports the workbook into SQLite if the customer table is empty.

## 4. MCP server

The FastAPI backend starts the local MCP server automatically when `START_MCP_SERVER=true` (the default in `.env.example`). You do not need a separate terminal. The MCP endpoint is `http://127.0.0.1:8001/mcp`.

## 5. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## 6. How to demonstrate the project

1. Open **Customer Explorer**.
2. Search or select any customer, for example `CUST00001`.
3. Inspect the customer's profile, behavioral snapshots, transactions and engagement history.
4. Click **Run AI Analysis**.
5. The application sends that customer's actual context through the agent pipeline.
6. The Need Inference and Message Generation stages use Groq when the key is configured.
7. Review the final decision, suppression/consent result, channel, message and escalation result.
8. Open Decision Center or Audit Logs to see the generated decision stored in SQLite.

There are no predefined financial-stress/investment/savings demo buttons in this version.

## Important: resetting the local database

If you previously ran an older version that contained hard-coded demo customers, stop the backend and delete:

```text
backend/ps22.db
```

Then start the backend again. It will rebuild the database from the workbook.

Do **not** delete `data/PS22_dataset.xlsx`.

## Agent flow

```text
Customer selection
      ↓
Signal Ingestion Agent
      ↓
Behavioral Shift Agent
      ↓
Need Inference Agent ── Groq
      ↓
Next Best Action Agent
      ↓
Message Generation Agent ── Groq
      ↓
Channel & Timing Agent
      ↓
Suppression & Consent Agent
      ↓
Response Tracking Agent
      ↓
Sensitive Escalation Agent
      ↓
Orchestrator Agent
      ↓
Final decision + audit record
```

## Data / AI boundary

The LLM is instructed to treat life events, financial stress, vulnerability and intent as hypotheses rather than facts. Governance decisions are kept deterministic so that opt-out, suppression, cooldown and escalation rules are not left entirely to the LLM.

## Docker

Create `backend/.env` first, then from the project root:

```powershell
docker compose up --build
```

The browser frontend runs on port `5173` and the API on port `8000`.

## 6. MCP integration (real Model Context Protocol)

This version adds an independent MCP server built with the official MCP Python SDK. It uses the **Streamable HTTP** transport at `http://127.0.0.1:8001/mcp`. The FastAPI customer assistant acts as the MCP host and uses the official MCP Python client to discover and execute tools. Groq chooses tools through its function/tool-calling interface; tool execution is performed by the MCP server, not by the LLM.

### MCP capabilities exposed

**Tools (read-only, backed by the existing SQLite database):**

- `get_customer_profile(customer_id)`
- `get_behavioral_signals(customer_id, limit)`
- `get_recent_transactions(customer_id, limit)`
- `get_engagement_history(customer_id, limit)`
- `get_latest_ai_decision(customer_id)`
- `get_customer_summary(customer_id)`

**Resources:**

- `customer://{customer_id}/profile`
- `customer://{customer_id}/behavior`
- `customer://{customer_id}/engagement`

**Prompts:**

- `customer_support_guidelines`
- `behavioral_analysis_guidelines`

The server exposes read-only operations. The FastAPI host binds each tool call to the customer selected in the route; the model cannot switch to another customer by changing a tool argument. The server also validates IDs and limits result sizes.

### MCP server lifecycle

When `START_MCP_SERVER=true`, FastAPI starts and stops the local MCP server as part of its application lifecycle. This is the recommended setup for local development and the single-service Render deployment. Set `START_MCP_SERVER=false` only when hosting MCP separately, such as in Docker Compose.

### Verify MCP

- Open `http://localhost:8000/api/mcp-status` after starting both services. It should report `connected: true` and list the discovered tools.
- Connect the official MCP Inspector to `http://127.0.0.1:8001/mcp` using Streamable HTTP. Inspect the tools, resources and prompts. Execute a tool with a real customer ID from Customer Explorer.
- In the app, open any customer profile and choose **Talk to Assistant**. Ask about recent account activity. The Groq model selects MCP tools, the MCP client calls them, and the tool results are supplied back to Groq for the final answer.

If the chatbot reports that MCP is unavailable, check that the MCP server terminal is still running and that `MCP_SERVER_URL` points to the correct address.

### Environment variables

```env
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_ACTUAL_GROQ_API_KEY
MODEL_NAME=openai/gpt-oss-120b
DATABASE_URL=sqlite:///./ps22.db
MCP_SERVER_URL=http://127.0.0.1:8001/mcp
MCP_HOST=127.0.0.1
MCP_PORT=8001
```

Use a Groq model available to your account that supports tool calling. Never put the real API key in source control.

## 7. LLM/application optimizations included

The seven techniques in the supplied reference image are mostly inference-engine or multi-GPU optimizations. Since this project calls a hosted Groq model, it cannot directly change Groq's internal quantization, KV cache, continuous batching, speculative decoding, tensor parallelism or pipeline parallelism. This implementation instead adds optimizations under our control:

1. **Prompt/context trimming:** inference prompts include a compact customer field set and bounded recent history rather than entire records.
2. **Compact serialization:** JSON prompts use compact separators to avoid whitespace overhead.
3. **Reusable HTTP connection pool:** Groq requests reuse a long-lived `httpx.AsyncClient` with connection limits rather than creating a new connection pool for every call.
4. **Customer-scoped MCP read cache:** repeated read-only customer tool requests are cached in the MCP process for 20 seconds. Cache keys include customer ID and tool/limit to prevent cross-customer reuse.
5. **MCP session reuse per chat turn:** the chatbot discovers tools and executes all tool calls in one MCP session for that turn.
6. **Bounded tool output:** recent transaction, signal and engagement tools cap returned rows to avoid sending oversized context to the LLM.
7. **Performance/token instrumentation:** `/api/performance` reports pipeline latency, Groq request latency, token usage, failures and chatbot/MCP tool-call counts. Compare these measurements before and after further changes; do not claim a speedup without measuring it.

These are application-level optimizations. They are not represented as internal Groq model optimizations.

## 8. Docker Compose

The compose file includes separate `backend`, `mcp` and `frontend` services. Create `backend/.env` first, then run from the project root:

```powershell
docker compose up --build
```

The backend and MCP service share a named volume for the SQLite database. The MCP service is reachable by the backend at `http://mcp:8001/mcp` inside the Compose network.

## 9. Troubleshooting

- **MCP disconnected:** Start the MCP process in its own terminal and check `/api/mcp-status`.
- **Groq tool call error:** Confirm the configured model supports tool calling and that the API key is valid.
- **No customer records:** Start the backend from the `backend` directory so the relative SQLite URL and workbook path resolve as documented. The workbook is imported on first startup.
- **Frontend build:** Run `npm install` and `npm run build` from `frontend`.


## Production deployment (Vercel + Render)

### Frontend on Vercel

1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add this environment variable (replace the value with your Render backend URL):

```env
VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com
```

The frontend app appends `/api` automatically. Do not add `/api` to the value.

### Backend on Render

The root `render.yaml` is a Render Blueprint for the Docker-based FastAPI service.

1. Create a new **Blueprint** in Render and select this repository, or create a Docker Web Service manually.
2. Keep the Docker context at the repository root and use `backend/Dockerfile`.
3. Set `GROQ_API_KEY` as a secret environment variable in Render. Never put the real key in `render.yaml` or Git.
4. Set `CORS_ORIGINS` to the exact Vercel production URL, for example `https://your-project.vercel.app`. Include `http://localhost:5173` only if local browser development is still needed.
5. Set `DATABASE_URL` to `sqlite:////tmp/ps22.db` for a quick demo deployment. The workbook is imported at startup. Render's temporary filesystem is not persistent: generated decisions and database changes may be lost after a restart or redeploy. Use a managed PostgreSQL database for persistent production data.
6. Once Render gives you the backend URL, add that URL to Vercel as `VITE_API_URL`, then redeploy the frontend.

The backend Docker container starts the MCP server as a child process, so the API and MCP tools share the same SQLite database and you do not need a second Render service for MCP.

### Health checks

- Backend health: `https://YOUR-RENDER-BACKEND.onrender.com/health`
- API docs: `https://YOUR-RENDER-BACKEND.onrender.com/docs`
- MCP status: `https://YOUR-RENDER-BACKEND.onrender.com/api/mcp-status`

### Deployment environment variables

Backend:
- `AI_PROVIDER=groq`
- `GROQ_API_KEY` (secret)
- `MODEL_NAME=openai/gpt-oss-120b`
- `DATABASE_URL=sqlite:////tmp/ps22.db` (demo only; ephemeral)
- `DATASET_PATH=/data/PS22_dataset.xlsx`
- `MCP_SERVER_URL=http://127.0.0.1:8001/mcp`
- `MCP_HOST=127.0.0.1`
- `MCP_PORT=8001`
- `START_MCP_SERVER=true`
- `CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app`

Frontend:
- `VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com`
