# Web System Stress Test

🌐 **Live Demo:** [stress.zubodub.ru](https://stress.zubodub.ru)

A modern, highly customizable browser-based CPU and GPU stress testing tool built with React, TypeScript, and WebGL.

Push your device to its absolute limits directly from your browser—no installation required.

![Interface Screenshot](https://raw.githubusercontent.com/zubodub/stress-test-page/main/public/screenshot.png)

## Features

- **CPU Stress Test**: Uses Web Workers to aggressively consume CPU cycles across multiple threads simultaneously.
- **GPU Stress Test**: Utilizes a highly complex WebGL shader loop to push your GPU's fragment shading capabilities to the max, rendering a beautiful "magma/neon" heat map based on load.
- **Customizable Intensity**: 
  - **Presets**: Quick toggles for Low, Medium, High, and Extreme loads.
  - **Custom Sliders**: Fine-tune the exact number of CPU threads (up to 4x your device's physical cores) and the number of GPU loop operations per pixel.
- **Live Metrics**: Monitor active threads, elapsed time, and real-time FPS (Frames Per Second) to see how your device throttles under load.
- **Screen Wake Lock**: Automatically prevents your phone or monitor from going to sleep while tests are running.
- **Responsive UI**: A gorgeous, glassmorphic dark-mode interface that perfectly adapts to desktop monitors, tablets, and smartphones.

## How It Works

- **CPU**: Spawns multiple hidden Web Workers. Each worker runs a continuous, heavy mathematical loop (calculating square roots and complex arithmetic) without yielding, forcing the CPU to maintain maximum clock speeds and generate heat.
- **GPU**: Renders a full-screen canvas using WebGL. The fragment shader is instructed to execute a massive, fixed-size mathematical loop (`sin`, `cos`, `length`, etc.) for every single pixel on your screen, up to 60 times a second.

## Development

This project is built with [Vite](https://vitejs.dev/) and React.

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/zubodub/stress-test-page.git
   cd stress-test-page
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Warning ⚠️

This application is designed to put maximum possible load on your hardware. **Use at your own risk.**
While modern devices have thermal throttling to protect themselves from overheating, running heavy stress tests for prolonged periods can quickly drain batteries, cause devices to become uncomfortably hot, and potentially lead to unexpected system crashes or reboots.

## License

MIT License
