/**
 * Core game loop hook for the space arcade shooter.
 * Manages player, asteroids, lasers, enemies, power-ups, particles, scoring, difficulty.
 * Accepts dynamic canvas dimensions for full responsiveness.
 * Supports pause / resume / restart.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import {
  PlayerState, Asteroid, Star, Laser, PowerUp, PowerUpType,
  EnemyShip, EnemyLaser, Particle, GameState, AsteroidSize
} from "./types";
import {
  clearCanvas, drawStars, drawPlayer, drawLaser, drawAsteroid,
  drawPowerUp, drawEnemy, drawEnemyLaser, drawParticles, drawHUD
} from "./renderer";
import { playLaserSound, playExplosionSound, playPowerUpSound, startAmbientMusic } from "./audio";

const BASE_W = 600;
const BASE_H = 700;
const PW = 36;
const PH = 40;
const SHOT_COOLDOWN = 250;
const RAPID_COOLDOWN = 100;
const STAR_COUNT = 140;
const POWERUP_DURATION = 5000;

// ─── Helpers ───

function createStars(w: number, h: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.7 + 0.3,
    twinkleSpeed: Math.random() * 3 + 1,
    speed: Math.random() * 0.3 + 0.1,
  }));
}

function defaultPlayer(w: number, h: number): PlayerState {
  return {
    x: w / 2 - PW / 2, y: h - 80, width: PW, height: PH,
    lives: 3, shieldActive: false, shieldTimer: 0,
    rapidFireActive: false, rapidFireTimer: 0,
    slowMotionActive: false, slowMotionTimer: 0,
    doubleScoreActive: false, doubleScoreTimer: 0,
    lastShotTime: 0, invincibleTimer: 0,
  };
}

const ASTEROID_SIZES: Record<AsteroidSize, { radius: number; health: number }> = {
  small: { radius: 10, health: 1 },
  medium: { radius: 20, health: 2 },
  large: { radius: 32, health: 3 },
};

function spawnParticles(particles: Particle[], x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1,
      color,
      size: Math.random() * 3 + 1,
    });
  }
}

function circleRect(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const dx = Math.abs(cx - (rx + rw / 2));
  const dy = Math.abs(cy - (ry + rh / 2));
  return dx < rw / 2 + cr * 0.7 && dy < rh / 2 + cr * 0.7;
}

// ─── Hook ───

export function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  canvasWidth: number,
  canvasHeight: number
) {
  const [gameState, setGameState] = useState<GameState>("start");
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState(1);

  const playerRef = useRef<PlayerState>(defaultPlayer(canvasWidth, canvasHeight));
  const asteroidsRef = useRef<Asteroid[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const enemiesRef = useRef<EnemyShip[]>([]);
  const enemyLasersRef = useRef<EnemyLaser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>(createStars(canvasWidth, canvasHeight));
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const diffRef = useRef(1);
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const gsRef = useRef<GameState>("start");
  const ambientStopRef = useRef<(() => void) | null>(null);
  // Store latest dimensions in refs so loop always uses current values
  const wRef = useRef(canvasWidth);
  const hRef = useRef(canvasHeight);

  // Sync dimension refs
  useEffect(() => {
    wRef.current = canvasWidth;
    hRef.current = canvasHeight;
    starsRef.current = createStars(canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  useEffect(() => { gsRef.current = gameState; }, [gameState]);

  const pauseGame = useCallback(() => {
    if (gsRef.current !== "playing") return;
    pausedRef.current = true;
    setPaused(true);
  }, []);

  const resumeGame = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (gsRef.current !== "playing") return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
    } else {
      pausedRef.current = true;
      setPaused(true);
    }
  }, []);

  // Key listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
      // Pause / resume via Escape or P
      if ((e.key === "Escape" || e.key === "p" || e.key === "P") && gsRef.current === "playing") {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Expose keysRef so touch controls outside the hook can simulate keypresses
  const pressKey = useCallback((key: string) => { keysRef.current.add(key); }, []);
  const releaseKey = useCallback((key: string) => { keysRef.current.delete(key); }, []);

  const startGame = useCallback(() => {
    const W = wRef.current;
    const H = hRef.current;
    playerRef.current = defaultPlayer(W, H);
    asteroidsRef.current = [];
    lasersRef.current = [];
    powerUpsRef.current = [];
    enemiesRef.current = [];
    enemyLasersRef.current = [];
    particlesRef.current = [];
    starsRef.current = createStars(W, H);
    scoreRef.current = 0;
    diffRef.current = 1;
    lastSpawnRef.current = 0;
    lastEnemySpawnRef.current = 0;
    setScore(0);
    setLives(3);
    setDifficulty(1);
    setGameState("playing");
    pausedRef.current = false;
    setPaused(false);

    if (ambientStopRef.current) ambientStopRef.current();
    ambientStopRef.current = startAmbientMusic();
  }, []);

  // Cleanup ambient on unmount
  useEffect(() => () => { if (ambientStopRef.current) ambientStopRef.current(); }, []);

  // Scale player speed proportionally to canvas size
  const getPlayerSpeed = () => Math.max(4, (wRef.current / BASE_W) * 5);
  const getLaserSpeed = () => Math.max(6, (hRef.current / BASE_H) * 8);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let animId: number;
    let prevTime = 0;

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(timestamp - (prevTime || timestamp), 33);
      const time = timestamp / 1000;
      const W = wRef.current;
      const H = hRef.current;

      clearCanvas(ctx, W, H);

      const stars = starsRef.current;
      // Only scroll stars when not paused
      if (!pausedRef.current) {
        prevTime = timestamp;
        stars.forEach(s => { s.y += s.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
      }
      drawStars(ctx, stars, time);

      if (gsRef.current !== "playing") return;

      // Draw pause overlay and stop all logic when paused
      if (pausedRef.current) {
        // Redraw current game objects without updating them
        lasersRef.current.forEach(l => drawLaser(ctx, l));
        asteroidsRef.current.forEach(a => drawAsteroid(ctx, a));
        powerUpsRef.current.forEach(pu => drawPowerUp(ctx, pu, time));
        enemiesRef.current.forEach(e => drawEnemy(ctx, e, time));
        enemyLasersRef.current.forEach(el => drawEnemyLaser(ctx, el));
        drawParticles(ctx, particlesRef.current);
        drawPlayer(ctx, playerRef.current, time);
        drawHUD(ctx, W, scoreRef.current, playerRef.current.lives, diffRef.current, playerRef.current);
        return;
      }

      const PLAYER_SPEED = getPlayerSpeed();
      const LASER_SPEED = getLaserSpeed();

      const player = playerRef.current;
      const keys = keysRef.current;
      const asteroids = asteroidsRef.current;
      const lasers = lasersRef.current;
      const powerUps = powerUpsRef.current;
      const enemies = enemiesRef.current;
      const eLasers = enemyLasersRef.current;
      const particles = particlesRef.current;
      const slowFactor = player.slowMotionActive ? 0.4 : 1;

      // ── Player movement ──
      if (keys.has("ArrowLeft")) player.x = Math.max(0, player.x - PLAYER_SPEED);
      if (keys.has("ArrowRight")) player.x = Math.min(W - player.width, player.x + PLAYER_SPEED);
      if (keys.has("ArrowUp")) player.y = Math.max(40, player.y - PLAYER_SPEED);
      if (keys.has("ArrowDown")) player.y = Math.min(H - player.height, player.y + PLAYER_SPEED);

      // ── Shooting ──
      const cooldown = player.rapidFireActive ? RAPID_COOLDOWN : SHOT_COOLDOWN;
      if (keys.has(" ") && timestamp - player.lastShotTime > cooldown) {
        player.lastShotTime = timestamp;
        lasers.push({
          id: idRef.current++,
          x: player.x + player.width / 2,
          y: player.y,
          speed: LASER_SPEED,
          width: 4,
          height: 14,
        });
        playLaserSound();
      }

      // ── Update lasers ──
      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y -= lasers[i].speed;
        if (lasers[i].y < -20) lasers.splice(i, 1);
      }

      // ── Spawn asteroids ──
      const spawnRate = Math.max(200, 800 - diffRef.current * 50);
      if (timestamp - lastSpawnRef.current > spawnRate) {
        lastSpawnRef.current = timestamp;
        const sizes: AsteroidSize[] = ["small", "medium", "large"];
        const sizeWeights = [0.3, 0.45, 0.25];
        let r = Math.random(), cumulative = 0, chosenSize: AsteroidSize = "medium";
        for (let i = 0; i < sizes.length; i++) {
          cumulative += sizeWeights[i];
          if (r < cumulative) { chosenSize = sizes[i]; break; }
        }
        const cfg = ASTEROID_SIZES[chosenSize];
        asteroids.push({
          id: idRef.current++,
          x: cfg.radius + Math.random() * (W - cfg.radius * 2),
          y: -cfg.radius,
          radius: cfg.radius + Math.random() * 4,
          speed: (1.5 + Math.random() * 1.5 + diffRef.current * 0.2) * slowFactor,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.06,
          size: chosenSize,
          health: cfg.health,
        });
      }

      // ── Spawn enemy ships (after difficulty 3) ──
      if (diffRef.current >= 3 && timestamp - lastEnemySpawnRef.current > 5000 - diffRef.current * 200) {
        lastEnemySpawnRef.current = timestamp;
        const dir = Math.random() < 0.5 ? 1 : -1;
        enemies.push({
          id: idRef.current++,
          x: dir === 1 ? -40 : W + 40,
          y: 60 + Math.random() * 120,
          width: 32, height: 28,
          speed: 1.5 + diffRef.current * 0.2,
          direction: dir,
          health: 2 + Math.floor(diffRef.current / 3),
          lastShotTime: timestamp,
        });
      }

      // ── Update asteroids ──
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.y += a.speed * slowFactor;
        a.rotation += a.rotationSpeed;
        if (a.y > H + a.radius) { asteroids.splice(i, 1); continue; }

        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          const dx = Math.abs(l.x - a.x);
          const dy = Math.abs(l.y - a.y);
          if (dx < a.radius && dy < a.radius) {
            lasers.splice(j, 1);
            a.health--;
            spawnParticles(particles, a.x, a.y, "#ffaa44", 6);
            if (a.health <= 0) {
              asteroids.splice(i, 1);
              playExplosionSound(a.size === "large");
              spawnParticles(particles, a.x, a.y, "#ff8833", a.size === "large" ? 20 : 10);

              if (a.size === "large" || a.size === "medium") {
                const childSize: AsteroidSize = a.size === "large" ? "medium" : "small";
                const childCfg = ASTEROID_SIZES[childSize];
                for (let k = 0; k < 2; k++) {
                  asteroids.push({
                    id: idRef.current++,
                    x: a.x + (k === 0 ? -15 : 15),
                    y: a.y,
                    radius: childCfg.radius + Math.random() * 3,
                    speed: a.speed * 1.2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.08,
                    size: childSize,
                    health: childCfg.health,
                  });
                }
              }

              const pts = a.size === "large" ? 30 : a.size === "medium" ? 20 : 10;
              scoreRef.current += player.doubleScoreActive ? pts * 2 : pts;

              if (Math.random() < 0.2) {
                const types: PowerUpType[] = ["rapidfire", "shield", "slowmo", "doublescore"];
                powerUps.push({
                  id: idRef.current++,
                  x: a.x, y: a.y,
                  radius: 10,
                  type: types[Math.floor(Math.random() * types.length)],
                  speed: 1.5,
                  pulse: 0,
                });
              }
            }
            break;
          }
        }
      }

      // ── Update enemies ──
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.speed * e.direction * slowFactor;
        if ((e.direction === 1 && e.x > W + 60) || (e.direction === -1 && e.x < -60)) {
          enemies.splice(i, 1); continue;
        }
        if (timestamp - e.lastShotTime > 1500) {
          e.lastShotTime = timestamp;
          eLasers.push({ id: idRef.current++, x: e.x + e.width / 2, y: e.y + e.height, speed: 4 });
        }
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          if (l.x > e.x && l.x < e.x + e.width && l.y > e.y && l.y < e.y + e.height) {
            lasers.splice(j, 1);
            e.health--;
            spawnParticles(particles, l.x, l.y, "#ff4444", 5);
            if (e.health <= 0) {
              enemies.splice(i, 1);
              playExplosionSound(true);
              spawnParticles(particles, e.x + e.width / 2, e.y + e.height / 2, "#ff2244", 25);
              scoreRef.current += player.doubleScoreActive ? 100 : 50;
            }
            break;
          }
        }
      }

      // ── Update enemy lasers ──
      for (let i = eLasers.length - 1; i >= 0; i--) {
        eLasers[i].y += eLasers[i].speed * slowFactor;
        if (eLasers[i].y > H + 10) { eLasers.splice(i, 1); continue; }
        const el = eLasers[i];
        if (el.x > player.x && el.x < player.x + player.width && el.y > player.y && el.y < player.y + player.height) {
          eLasers.splice(i, 1);
          if (player.shieldActive) { player.shieldActive = false; player.shieldTimer = 0; }
          else if (player.invincibleTimer <= 0) {
            player.lives--;
            player.invincibleTimer = 1500;
            spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 15);
            if (player.lives <= 0) {
              spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 40);
              playExplosionSound(true);
              setGameState("gameover");
              if (ambientStopRef.current) { ambientStopRef.current(); ambientStopRef.current = null; }
            }
          }
        }
      }

      // ── Update power-ups ──
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        pu.y += pu.speed * slowFactor;
        if (pu.y > H + 20) { powerUps.splice(i, 1); continue; }
        if (circleRect(pu.x, pu.y, pu.radius, player.x, player.y, player.width, player.height)) {
          powerUps.splice(i, 1);
          playPowerUpSound();
          switch (pu.type) {
            case "rapidfire": player.rapidFireActive = true; player.rapidFireTimer = POWERUP_DURATION; break;
            case "shield": player.shieldActive = true; player.shieldTimer = POWERUP_DURATION; break;
            case "slowmo": player.slowMotionActive = true; player.slowMotionTimer = POWERUP_DURATION; break;
            case "doublescore": player.doubleScoreActive = true; player.doubleScoreTimer = POWERUP_DURATION; break;
          }
        }
      }

      // ── Player-asteroid collision ──
      for (const a of asteroids) {
        if (circleRect(a.x, a.y, a.radius, player.x, player.y, player.width, player.height)) {
          if (player.shieldActive) {
            player.shieldActive = false;
            player.shieldTimer = 0;
            const idx = asteroids.indexOf(a);
            if (idx !== -1) asteroids.splice(idx, 1);
            spawnParticles(particles, a.x, a.y, "#00ffcc", 15);
            playExplosionSound(false);
            break;
          } else if (player.invincibleTimer <= 0) {
            player.lives--;
            player.invincibleTimer = 1500;
            spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 15);
            const idx = asteroids.indexOf(a);
            if (idx !== -1) asteroids.splice(idx, 1);
            if (player.lives <= 0) {
              spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 40);
              playExplosionSound(true);
              setGameState("gameover");
              if (ambientStopRef.current) { ambientStopRef.current(); ambientStopRef.current = null; }
            }
            break;
          }
        }
      }

      // ── Player-enemy collision ──
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (player.x < e.x + e.width && player.x + player.width > e.x &&
          player.y < e.y + e.height && player.y + player.height > e.y) {
          if (player.shieldActive) {
            player.shieldActive = false; player.shieldTimer = 0;
            enemies.splice(i, 1);
            spawnParticles(particles, e.x + e.width / 2, e.y + e.height / 2, "#ff2244", 20);
            playExplosionSound(true);
          } else if (player.invincibleTimer <= 0) {
            player.lives--;
            player.invincibleTimer = 1500;
            enemies.splice(i, 1);
            spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 15);
            if (player.lives <= 0) {
              spawnParticles(particles, player.x + PW / 2, player.y + PH / 2, "#00ccff", 40);
              playExplosionSound(true);
              setGameState("gameover");
              if (ambientStopRef.current) { ambientStopRef.current(); ambientStopRef.current = null; }
            }
          }
          break;
        }
      }

      // ── Timers ──
      if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
      if (player.rapidFireActive) { player.rapidFireTimer -= dt; if (player.rapidFireTimer <= 0) player.rapidFireActive = false; }
      if (player.shieldActive) { player.shieldTimer -= dt; if (player.shieldTimer <= 0) player.shieldActive = false; }
      if (player.slowMotionActive) { player.slowMotionTimer -= dt; if (player.slowMotionTimer <= 0) player.slowMotionActive = false; }
      if (player.doubleScoreActive) { player.doubleScoreTimer -= dt; if (player.doubleScoreTimer <= 0) player.doubleScoreActive = false; }

      // ── Particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / 1000;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // ── Score & difficulty ──
      scoreRef.current += player.doubleScoreActive ? 2 : 1;
      const newDiff = Math.floor(scoreRef.current / 500) + 1;
      if (newDiff !== diffRef.current) { diffRef.current = newDiff; setDifficulty(newDiff); }
      setScore(scoreRef.current);
      setLives(player.lives);

      // ── Draw everything ──
      lasers.forEach(l => drawLaser(ctx, l));
      asteroids.forEach(a => drawAsteroid(ctx, a));
      powerUps.forEach(pu => drawPowerUp(ctx, pu, time));
      enemies.forEach(e => drawEnemy(ctx, e, time));
      eLasers.forEach(el => drawEnemyLaser(ctx, el));
      drawParticles(ctx, particles);
      drawPlayer(ctx, player, time);
      drawHUD(ctx, W, scoreRef.current, player.lives, diffRef.current, player);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, canvasWidth, canvasHeight]);

  return { gameState, score, lives, difficulty, paused, startGame, pauseGame, resumeGame, togglePause, pressKey, releaseKey };
}
