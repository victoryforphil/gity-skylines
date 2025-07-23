# Gity Skylines

React based Git City Generator inspired from Gource - A 3D visualization of code repositories as cities built with React Three Fiber, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Recommended for Web Development)
1. Click the green "Code" button above
2. Select "Codespaces" tab  
3. Click "Create codespace on main"
4. Wait for the container to build
5. Run `./start-dev.sh` or `cd github-city-generator && bun run dev`

### Option 2: VS Code Dev Container
1. Install [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Clone this repository
3. Open in VS Code and click "Reopen in Container"
4. Run `./start-dev.sh` or `cd github-city-generator && bun run dev`

### Option 3: Local Development
1. Install [Bun](https://bun.sh/)
2. Clone this repository
3. Run:
   ```bash
   cd github-city-generator
   bun install
   bun run dev
   ```

## 🏗️ Project Structure

This project creates a 3D "code city" where different code elements are represented as buildings:

- **Classes** → Blue buildings
- **Functions** → Green buildings  
- **Modules** → Yellow buildings
- **Components** → Red buildings

## 🛠️ Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Bun** - Package manager and runtime
- **React Three Fiber** - 3D rendering
- **@react-three/drei** - 3D helpers
- **Three.js** - 3D graphics library

## 🔧 Development Environment

This repository includes a complete GitHub Codespaces / VS Code Dev Container setup with:

- **Pre-configured development environment** with all tools installed
- **VS Code extensions** for React, TypeScript, Tailwind, and 3D development
- **Automatic dependency installation** 
- **Port forwarding** for the development server
- **Consistent formatting** with Prettier and ESLint

See [`.devcontainer/README.md`](.devcontainer/README.md) for detailed setup instructions.

## 🎮 Controls

- **Mouse drag** - Rotate camera
- **Mouse wheel** - Zoom in/out
- **Right click + drag** - Pan camera

## 📝 License

MIT License - feel free to use this project as a starting point for your own code city visualizations!
