# Asteroid Blaster

A fast-paced, browser-based space arcade shooter built with React, TypeScript, Vite, and the HTML5 Canvas API.

## Gameplay

- **Arrow keys** — move your ship
- **Spacebar** — fire lasers
- Destroy asteroids to score points
- Collect power-ups dropped by destroyed asteroids:
  - 🔴 **Rapid Fire** — faster shooting
  - 🟢 **Shield** — one-hit protection
  - 🟣 **Slow Motion** — slows all enemies
  - 🟡 **2× Score** — doubles points earned
- Enemy ships appear at higher difficulty levels
- Survive as long as possible!

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Bundler | Vite |
| Rendering | HTML5 Canvas 2D |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State management | React hooks + refs |
