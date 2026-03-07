# Flappy Bird — Next.js Edition

A beautiful, responsive Flappy Bird clone built with **Next.js 15**, **TypeScript**, and **HTML5 Canvas**.

## Features

- **Smooth gameplay** — physics-based bird movement with gravity, velocity, and rotation
- **Beautiful visuals** — gradient sky, animated pipes, glowing score display
- **Responsive design** — adapts to any screen size, works on desktop and mobile
- **Touch support** — tap to flap on mobile, Space/click on desktop
- **Best score tracking** — persists during the session
- **Animated UI** — idle screen bobbing, game over animations, score pop effects
- **SVG favicon** — custom bird icon

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

| Action | Control |
|--------|---------|
| Flap | `Space`, `Click`, or `Tap` |
| Restart | `Space`, `Click`, or `Tap` after Game Over |

Navigate the bird through the gaps between the green pipes. Each pipe cleared earns 1 point.

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Tailwind CSS v4](https://tailwindcss.com/) — UI styling
- HTML5 Canvas — game rendering

## Project Structure

```
app/
  components/
    FlappyBird.tsx   # Main game component (canvas rendering + game logic)
  globals.css        # Global styles + animations
  layout.tsx         # Root layout with metadata & favicon
  page.tsx           # Entry page
public/
  favicon.svg        # Custom bird favicon
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Lint the code
```

## License

MIT
