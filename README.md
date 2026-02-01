<div align="center">

# port-arranger

**Run multiple dev servers without port conflicts**

[Quick Start](#quick-start) · [Usage Guide](#usage-guide) · [Commands](#commands) · [How It Works](#how-it-works)

<p align="center">
  <a href="https://www.npmjs.com/package/port-arranger"><img src="https://img.shields.io/npm/v/port-arranger.svg" alt="npm version"></a>
  <img src="https://img.shields.io/github/license/mindori/port-arranger" alt="license">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node version">
  <img src="https://img.shields.io/badge/AI-Claude-blueviolet" alt="AI powered by Claude">
</p>

</div>

<br />

<div align="center">
  <img src="assets/demo.gif" alt="port-arranger demo" width="600" />
</div>

<br />

## Why port-arranger?

### The Problem

```bash
# Terminal 1
npm run dev  # localhost:3000

# Terminal 2
npm run dev  # Error: Port 3000 is already in use
```

When running multiple projects simultaneously during development, port conflicts are inevitable. You end up manually changing ports or hunting down processes to kill.

### The Solution

```bash
pa run "npm run dev"  # Automatically assigns an available port
```

port-arranger wraps your dev server commands and automatically finds and assigns available ports. No more port conflicts, ever.

### Key Features

|                    | Feature                  | Description                                          |
| ------------------ | ------------------------ | ---------------------------------------------------- |
| :zap:              | **Auto Port Assignment** | Automatically finds and assigns available ports      |
| :mag:              | **Framework Detection**  | Recognizes Next.js, Vite, Express, FastAPI, and more |
| :clipboard:        | **Process Management**   | List, monitor, and stop running servers              |
| :desktop_computer: | **GUI Dashboard**        | Visual server management with Electron-based UI      |

## Requirements

- **Node.js 18+**

## Quick Start

```bash
# Install globally
npm install -g port-arranger

# Run your dev server
pa run "npm run dev"
```

That's it! port-arranger handles the rest.

## Usage Guide

### Step 1: Run a Server

```bash
# Basic usage
pa run "npm run dev"

# With a custom name
pa run "npm run dev" --name my-frontend

# With a preferred port (falls back to available port if taken)
pa run "npm run dev" --port 3000
```

### Step 2: Manage Servers

```bash
# List all running servers
pa list

# Stop a specific server
pa stop my-frontend

# Stop all servers
pa stop --all
```

### Step 3: GUI Dashboard

Launch the visual dashboard for an overview of all your running servers:

```bash
pa ui
```

## Commands

| Command                   | Description                             | Example                            |
| ------------------------- | --------------------------------------- | ---------------------------------- |
| `pa run <cmd>`            | Run a command with auto port assignment | `pa run "npm run dev"`             |
| `pa run <cmd> --name <n>` | Run with a custom project name          | `pa run "npm run dev" --name api`  |
| `pa run <cmd> --port <p>` | Run with a preferred port               | `pa run "npm run dev" --port 3000` |
| `pa list`                 | List all running servers                | `pa list`                          |
| `pa stop <name>`          | Stop a server by name                   | `pa stop my-project`               |
| `pa stop --all`           | Stop all running servers                | `pa stop --all`                    |
| `pa ui`                   | Open the GUI dashboard                  | `pa ui`                            |

## Supported Frameworks

| Framework          | Port Injection Method | Example                        |
| ------------------ | --------------------- | ------------------------------ |
| Next.js            | Environment variable  | `PORT=3001 npm run dev`        |
| Vite               | CLI flag              | `vite --port 3001`             |
| Express            | Environment variable  | `PORT=3001 node server.js`     |
| FastAPI / uvicorn  | CLI flag              | `uvicorn main:app --port 3001` |
| Python http.server | Argument              | `python -m http.server 3001`   |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  pa run "npm run dev"                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Parse Command                                           │
│     Detect framework pattern (Next.js, Vite, Express, etc.) │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Find Available Port                                     │
│     Use detect-port to find an open port                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Inject Port                                             │
│     Apply framework-specific injection (env, flag, arg)     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Spawn & Track Process                                   │
│     Save process info to ~/.port-arranger/state.json        │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

port-arranger stores state in `~/.port-arranger/state.json`:

```json
{
  "processes": [
    {
      "name": "my-frontend",
      "port": 3001,
      "pid": 12345,
      "command": "npm run dev",
      "cwd": "/path/to/project",
      "startedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests

## Author

[Changmin (Chris) Kang](https://github.com/mindori)
