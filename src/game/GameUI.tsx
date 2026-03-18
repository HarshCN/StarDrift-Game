/**
 * UI overlay components for the space arcade shooter:
 * Start screen, Game Over screen (canvas HUD handles in-game display).
 */

import { GameState } from "./types";

interface GameUIProps {
  gameState: GameState;
  score: number;
  onStart: () => void;
}

export function GameUI({ gameState, score, onStart }: GameUIProps) {
  if (gameState === "start") {
    return (
      <Overlay>
        <h1 className="text-5xl font-bold tracking-tight text-primary drop-shadow-[0_0_30px_hsl(var(--game-glow))] mb-2">
          ★ ASTEROID BLASTER ★
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs text-center leading-relaxed">
          Arrow keys to move · Spacebar to shoot<br />
          Destroy asteroids · Collect power-ups · Survive!
        </p>
        <button
          onClick={onStart}
          className="mt-8 px-10 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-wider hover:brightness-125 transition-all shadow-[0_0_30px_hsl(var(--game-glow)/0.5)] hover:shadow-[0_0_50px_hsl(var(--game-glow)/0.7)]"
        >
          START GAME
        </button>
        <div className="mt-6 flex gap-4 text-xs text-muted-foreground">
          <span className="text-destructive">♥♥♥</span> 3 Lives
          <span>·</span>
          <span>Power-ups drop from destroyed asteroids</span>
        </div>
      </Overlay>
    );
  }

  if (gameState === "gameover") {
    return (
      <Overlay>
        <h2 className="text-4xl font-bold text-destructive drop-shadow-[0_0_20px_hsl(var(--destructive))] tracking-wider">
          GAME OVER
        </h2>
        <p className="text-foreground text-2xl mt-4 font-mono">
          Final Score: <span className="text-primary drop-shadow-[0_0_10px_hsl(var(--game-glow))]">{score}</span>
        </p>
        <button
          onClick={onStart}
          className="mt-8 px-10 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-wider hover:brightness-125 transition-all shadow-[0_0_30px_hsl(var(--game-glow)/0.5)]"
        >
          PLAY AGAIN
        </button>
      </Overlay>
    );
  }

  return null;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md z-10">
      {children}
    </div>
  );
}
