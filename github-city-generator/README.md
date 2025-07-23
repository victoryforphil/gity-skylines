# GitHub City Generator

A 3D visualization of code repositories as cities built with React Three Fiber, TypeScript, Tailwind CSS, and Bun.

## 🏗️ Project Structure

This project creates a 3D "code city" where different code elements are represented as buildings:

- **Classes** → Blue buildings
- **Functions** → Green buildings  
- **Modules** → Yellow buildings
- **Components** → Red buildings

## 🚀 Features

- **Low-poly terrain** with procedural generation
- **Interactive 3D scene** with orbit controls
- **Code-based building generation** with height based on lines of code
- **Complexity visualization** through building opacity
- **Road grid system** representing code organization
- **Real-time rendering** with React Three Fiber
- **Responsive design** with Tailwind CSS

## 🛠️ Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Bun** - Package manager and runtime
- **React Three Fiber** - 3D rendering
- **@react-three/drei** - 3D helpers
- **Three.js** - 3D graphics library

## 🎮 Controls

- **Mouse drag** - Rotate camera
- **Mouse wheel** - Zoom in/out
- **Right click + drag** - Pan camera

## 🏃‍♂️ Getting Started

### Prerequisites

- Bun installed on your system

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Build for production:
   ```bash
   bun run build
   ```

## 🏙️ Components

### Core Components

- **Scene** - Main 3D canvas and lighting setup
- **EnhancedTerrain** - Procedural low-poly terrain
- **GitHubCity** - Main city layout with mock repository data
- **CodeBuilding** - Individual building representing code elements
- **RoadGrid** - Street network

### Visualization Logic

- **Building Height** - Proportional to lines of code
- **Building Color** - Based on code element type
- **Building Opacity** - Represents code complexity
- **Position** - Organized in a grid pattern

## 🔮 Future Enhancements

This foundation is ready for GitHub integration to create real repository visualizations:

- GitHub API integration
- Real repository analysis
- Interactive building selection
- Code metrics visualization
- Animated transitions
- Multiple repository comparison

## 📝 License

MIT License - feel free to use this project as a starting point for your own code city visualizations!
