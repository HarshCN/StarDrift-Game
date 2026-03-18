/**
 * Main Game component — combines canvas renderer with UI overlays.
 */

import { useRef } from "react";
import { useGameLoop } from "./useGameLoop";
import { GameUI } from "./GameUI";

export default function SpaceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, score, startGame, canvasWidth, canvasHeight } = useGameLoop(canvasRef);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background select-none">
      <div
        className="relative rounded-xl overflow-hidden border border-border shadow-[0_0_60px_hsl(var(--game-glow)/0.15)]"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <canvas ref={canvasRef} className="block" />
        <GameUI gameState={gameState} score={score} onStart={startGame} />
      </div>
    </div>
  );
}
