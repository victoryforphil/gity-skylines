# GitHub City Generator Dev Container

This dev container provides a complete development environment for the GitHub City Generator project with all necessary tools and extensions pre-configured.

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Recommended)
1. Open this repository in GitHub
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"
5. Wait for the container to build and start
6. Run `cd github-city-generator && bun run dev` to start development

### Option 2: VS Code with Dev Containers Extension
1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Clone this repository locally
3. Open the repository in VS Code
4. When prompted, click "Reopen in Container" or use `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
5. Wait for the container to build
6. Run `cd github-city-generator && bun run dev` to start development

## 🛠️ What's Included

### Runtime & Package Manager
- **Node.js 20** - JavaScript runtime
- **Bun** - Fast package manager and bundler
- **TypeScript** - Type-safe JavaScript

### Pre-installed VS Code Extensions
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **TypeScript** - Enhanced TypeScript support
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **Path Intellisense** - Autocomplete for file paths
- **Error Lens** - Inline error highlighting
- **Code Spell Checker** - Spell checking for code
- **Three.js support** - Syntax highlighting for 3D development
- **Shader support** - GLSL syntax highlighting

### Development Tools
- **Git** - Version control
- **Zsh + Oh My Zsh** - Enhanced shell experience
- **Common utilities** - curl, wget, vim, nano, tree, jq

## 🔧 Configuration

### Port Forwarding
- **5173** - Vite development server
- **4173** - Vite preview server

### VS Code Settings
- Format on save enabled
- ESLint auto-fix on save
- TypeScript auto-imports
- Tailwind CSS class completion
- Emmet support for JSX/TSX

## 🎮 Available Commands

After the container starts, navigate to the project directory and use these commands:

```bash
cd github-city-generator

# Install dependencies (automatically done on container creation)
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run linting
bun run lint
```

## 🌐 Accessing Your App

Once you run `bun run dev`, the Vite development server will start on port 5173. In Codespaces or VS Code, you'll see a notification to open the forwarded port in your browser.

## 🔄 Rebuilding the Container

If you make changes to the dev container configuration:

### In Codespaces:
- Go to Command Palette (`Ctrl+Shift+P`)
- Run "Codespaces: Rebuild Container"

### In VS Code:
- Go to Command Palette (`Ctrl+Shift+P`)
- Run "Dev Containers: Rebuild Container"

## 🐛 Troubleshooting

### Bun not found
If you encounter "bun: command not found", restart your terminal or run:
```bash
source ~/.bashrc
# or
source ~/.zshrc
```

### Port already in use
If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.).

### Container build fails
Try rebuilding the container or check the Docker logs for specific error messages.

## 📁 Project Structure

```
gity-skylines/
├── .devcontainer/
│   ├── devcontainer.json    # Dev container configuration
│   ├── Dockerfile          # Custom container image
│   ├── docker-compose.yml  # Alternative Docker Compose setup
│   └── README.md           # This file
├── github-city-generator/   # Main React application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies and scripts
│   └── ...
└── README.md               # Project README
```

## 🎯 Happy Coding!

Your development environment is now ready for building amazing 3D code city visualizations! 🏙️✨
