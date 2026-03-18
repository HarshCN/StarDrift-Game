/** Shared types for the space arcade shooter */

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  shieldActive: boolean;
  shieldTimer: number;
  rapidFireActive: boolean;
  rapidFireTimer: number;
  slowMotionActive: boolean;
  slowMotionTimer: number;
  doubleScoreActive: boolean;
  doubleScoreTimer: number;
  lastShotTime: number;
  invincibleTimer: number;
}

export type AsteroidSize = "small" | "medium" | "large";

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  size: AsteroidSize;
  health: number;
}

export interface Laser {
  id: number;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export type PowerUpType = "rapidfire" | "shield" | "slowmo" | "doublescore";

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: PowerUpType;
  speed: number;
  pulse: number;
}

export interface EnemyShip {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: number; // 1 or -1
  health: number;
  lastShotTime: number;
}

export interface EnemyLaser {
  id: number;
  x: number;
  y: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  speed: number;
}

export type GameState = "start" | "playing" | "gameover";

export interface GameData {
  player: PlayerState;
  asteroids: Asteroid[];
  lasers: Laser[];
  powerUps: PowerUp[];
  enemies: EnemyShip[];
  enemyLasers: EnemyLaser[];
  particles: Particle[];
  stars: Star[];
  score: number;
  difficulty: number;
  gameState: GameState;
}
