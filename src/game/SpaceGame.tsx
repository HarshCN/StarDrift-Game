/**
 * Main Game component — combines canvas renderer with UI overlays.
 * Fully responsive: canvas fills the viewport maintaining a 6:7 aspect ratio.
 */

import { useRef, useEffect, useState } from "react";
import { useGameLoop } from "./useGameLoop";
import { GameUI } from "./GameUI";

// ─── Responsive sizing hook ───

function useCanvasSize() {
  const [size, setSize] = useState(() => computeSize(window.innerWidth, window.innerHeight));

  useEffect(() => {
    const handleResize = () =>
      setSize(computeSize(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return size;
}

function computeSize(vw: number, vh: number) {
  const ASPECT = 6 / 7;
  const maxW = Math.min(vw, 900);
  const maxH = vh;

  let w = maxW;
  let h = Math.round(w / ASPECT);

  if (h > maxH) {
    h = maxH;
    w = Math.round(h * ASPECT);
  }

  w = Math.max(w, 280);
  h = Math.max(h, 320);

  return { w, h };
}

// ─── Main component ───

export default function SpaceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { w: canvasWidth, h: canvasHeight } = useCanvasSize();
  const {
    gameState, score, paused, startGame,
    pauseGame, resumeGame
  } = useGameLoop(canvasRef, canvasWidth, canvasHeight);

  // Keep canvas element dimensions in sync with computed size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }, [canvasWidth, canvasHeight]);

  return (
    <div
      className="flex items-center justify-center w-full min-h-screen bg-background select-none overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <div
        className="relative overflow-hidden rounded-xl border border-border shadow-[0_0_60px_hsl(var(--game-glow)/0.15)]"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        <GameUI
          gameState={gameState}
          score={score}
          paused={paused}
          onStart={startGame}
          onPause={pauseGame}
          onResume={resumeGame}
          onRestart={startGame}
        />

        {/* Top-corner pause button — visible only when playing and NOT paused */}
        {gameState === "playing" && !paused && (
          <button
            onClick={pauseGame}
            className="absolute top-14 right-4 w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm text-white hover:bg-white/20 active:scale-95 transition-all z-20 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            aria-label="Pause Game"
          >
            ⏸
          </button>
        )}
      </div>
    </div>
  );
}
