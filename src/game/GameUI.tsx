/**
 * UI overlay components for the space arcade shooter:
 * Start screen, Game Over screen, and Pause Menu.
 * Fully responsive using fluid text and max-width constraints.
 */

import { GameState } from "./types";

interface GameUIProps {
  gameState: GameState;
  score: number;
  paused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export function GameUI({ gameState, score, paused, onStart, onResume, onRestart }: GameUIProps) {
  if (gameState === "start") {
    return (
      <Overlay>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary drop-shadow-[0_0_30px_hsl(var(--game-glow))] mb-4 text-center px-4">
          ★ ASTEROID BLASTER ★
        </h1>

        {/* Expanded Controls & Rules Box */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 sm:p-6 mb-6 max-w-[90vw] sm:max-w-sm backdrop-blur-sm text-center">
          <h2 className="text-white font-bold text-lg mb-3 tracking-wider">HOW TO PLAY</h2>

          <div className="space-y-3 text-sm text-zinc-300">
            <p className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
              <span className="font-bold text-white">MOVE</span>
              <kbd className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs">Arrow Keys</kbd>
            </p>
            <p className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
              <span className="font-bold text-white">SHOOT</span>
              <kbd className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs">Spacebar</kbd>
            </p>
            <p className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
              <span className="font-bold text-white">PAUSE</span>
              <kbd className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs">Esc / P</kbd>
            </p>
          </div>

          <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
            Destroy asteroids to increase your score.<br />
            Collect <strong className="text-amber-400">power-ups</strong> that drop from asteroids.<br />
            You have <strong className="text-destructive">3 lives</strong>. Survive!
          </div>
        </div>

        <button
          onClick={onStart}
          className="px-10 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-wider hover:brightness-125 transition-all shadow-[0_0_30px_hsl(var(--game-glow)/0.5)] hover:shadow-[0_0_50px_hsl(var(--game-glow)/0.7)] active:scale-95"
        >
          START GAME
        </button>
      </Overlay>
    );
  }

  // HTML Pause Menu Overlay
  if (gameState === "playing" && paused) {
    return (
      <Overlay>
        <h2 className="text-4xl sm:text-5xl font-bold text-[#00ccff] drop-shadow-[0_0_20px_#00ccff] tracking-widest mb-8">
          PAUSED
        </h2>

        <div className="flex flex-col gap-4 w-[60vw] max-w-[240px]">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold tracking-wider hover:bg-white/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            ▶ RESUME
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-lg bg-destructive/80 border border-destructive text-white font-bold tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            ↺ RESTART
          </button>
        </div>
      </Overlay>
    );
  }

  if (gameState === "gameover") {
    return (
      <Overlay>
        <h2 className="text-3xl sm:text-4xl font-bold text-destructive drop-shadow-[0_0_20px_hsl(var(--destructive))] tracking-wider">
          GAME OVER
        </h2>
        <p className="text-foreground text-xl sm:text-2xl mt-4 font-mono text-center mb-8">
          Final Score:{" "}
          <span className="text-primary drop-shadow-[0_0_10px_hsl(var(--game-glow))]">
            {score}
          </span>
        </p>
        <button
          onClick={onStart}
          className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-base sm:text-lg tracking-wider hover:brightness-125 transition-all shadow-[0_0_30px_hsl(var(--game-glow)/0.5)] active:scale-95"
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
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
      {children}
    </div>
  );
}
