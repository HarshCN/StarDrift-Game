/**
 * Canvas rendering functions for the space arcade shooter.
 * Draws background, stars, player, asteroids, lasers, power-ups, enemies, particles, HUD.
 */

import { PlayerState, Asteroid, Star, Laser, PowerUp, EnemyShip, EnemyLaser, Particle } from "./types";

// ─── Background & Stars ───

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#050810");
  grad.addColorStop(0.5, "#0a0e1a");
  grad.addColorStop(1, "#0d1225");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], time: number) {
  stars.forEach((star) => {
    const flicker = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 245, 200, ${star.opacity * flicker})`;
    ctx.fill();
  });
}

// ─── Player Ship ───

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number) {
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;

  // Invincibility flash
  if (player.invincibleTimer > 0 && Math.floor(time * 10) % 2 === 0) return;

  // Shield bubble
  if (player.shieldActive) {
    ctx.beginPath();
    ctx.arc(cx, cy, player.width * 0.9, 0, Math.PI * 2);
    const shieldGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, player.width * 0.9);
    shieldGrad.addColorStop(0, "rgba(0, 255, 200, 0.05)");
    shieldGrad.addColorStop(0.7, "rgba(0, 255, 200, 0.1)");
    shieldGrad.addColorStop(1, "rgba(0, 255, 200, 0.3)");
    ctx.fillStyle = shieldGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 255, 200, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, player.width * 1.2);
  glow.addColorStop(0, "rgba(0, 180, 255, 0.25)");
  glow.addColorStop(1, "rgba(0, 180, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - player.width * 1.2, cy - player.width * 1.2, player.width * 2.4, player.width * 2.4);

  // Ship body
  ctx.beginPath();
  ctx.moveTo(cx, player.y);
  ctx.lineTo(player.x + 2, player.y + player.height);
  ctx.lineTo(cx - 4, player.y + player.height - 8);
  ctx.lineTo(cx + 4, player.y + player.height - 8);
  ctx.lineTo(player.x + player.width - 2, player.y + player.height);
  ctx.closePath();

  const shipGrad = ctx.createLinearGradient(cx, player.y, cx, player.y + player.height);
  shipGrad.addColorStop(0, "#00ccff");
  shipGrad.addColorStop(1, "#0066cc");
  ctx.fillStyle = shipGrad;
  ctx.shadowColor = "#00b4ff";
  ctx.shadowBlur = 18;
  ctx.fill();

  // Cockpit
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#aaeeff";
  ctx.fill();

  // Engine flames
  const flameH = 10 + Math.sin(time * 20) * 5;
  for (const offset of [-7, 0, 7]) {
    ctx.beginPath();
    ctx.moveTo(cx + offset - 3, player.y + player.height);
    ctx.lineTo(cx + offset, player.y + player.height + flameH);
    ctx.lineTo(cx + offset + 3, player.y + player.height);
    ctx.fillStyle = offset === 0 ? "#ffaa00" : "#ff6600";
    ctx.shadowColor = "#ff4400";
    ctx.shadowBlur = 8;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// ─── Lasers ───

export function drawLaser(ctx: CanvasRenderingContext2D, laser: Laser) {
  // Glow
  const glow = ctx.createRadialGradient(laser.x, laser.y, 0, laser.x, laser.y, 12);
  glow.addColorStop(0, "rgba(0, 255, 100, 0.4)");
  glow.addColorStop(1, "rgba(0, 255, 100, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(laser.x - 12, laser.y - 12, 24, 24);

  // Beam
  ctx.fillStyle = "#00ff66";
  ctx.shadowColor = "#00ff66";
  ctx.shadowBlur = 10;
  ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
  ctx.shadowBlur = 0;

  // Bright core
  ctx.fillStyle = "#aaffcc";
  ctx.fillRect(laser.x - 1, laser.y, 2, laser.height);
}

// ─── Asteroids ───

export function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: Asteroid) {
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rotation);

  const points = asteroid.size === "small" ? 6 : asteroid.size === "medium" ? 8 : 10;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jitter = asteroid.radius * (0.7 + Math.sin(i * 2.5 + asteroid.id) * 0.3);
    const px = Math.cos(angle) * jitter;
    const py = Math.sin(angle) * jitter;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius);
  grad.addColorStop(0, "#aa7722");
  grad.addColorStop(1, "#664411");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "#cc9944";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#ff660044";
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ─── Power-Ups ───

const POWERUP_COLORS: Record<string, { main: string; glow: string; label: string }> = {
  rapidfire: { main: "#ff4444", glow: "rgba(255, 68, 68, 0.4)", label: "R" },
  shield: { main: "#00ffcc", glow: "rgba(0, 255, 204, 0.4)", label: "S" },
  slowmo: { main: "#8844ff", glow: "rgba(136, 68, 255, 0.4)", label: "T" },
  doublescore: { main: "#ffcc00", glow: "rgba(255, 204, 0, 0.4)", label: "2x" },
};

export function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, time: number) {
  const colors = POWERUP_COLORS[pu.type];
  const pulse = 1 + Math.sin(time * 4 + pu.id) * 0.15;
  const r = pu.radius * pulse;

  // Outer glow
  const glow = ctx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, r * 2);
  glow.addColorStop(0, colors.glow);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(pu.x - r * 2, pu.y - r * 2, r * 4, r * 4);

  // Body
  ctx.beginPath();
  ctx.arc(pu.x, pu.y, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.main;
  ctx.shadowColor = colors.main;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(colors.label, pu.x, pu.y + 1);
}

// ─── Enemy Ships ───

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyShip, time: number) {
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height / 2;

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, enemy.width);
  glow.addColorStop(0, "rgba(255, 50, 50, 0.2)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - enemy.width, cy - enemy.width, enemy.width * 2, enemy.width * 2);

  // Body (inverted triangle)
  ctx.beginPath();
  ctx.moveTo(cx, enemy.y + enemy.height);
  ctx.lineTo(enemy.x, enemy.y);
  ctx.lineTo(enemy.x + enemy.width, enemy.y);
  ctx.closePath();
  const shipGrad = ctx.createLinearGradient(cx, enemy.y, cx, enemy.y + enemy.height);
  shipGrad.addColorStop(0, "#ff2244");
  shipGrad.addColorStop(1, "#aa1133");
  ctx.fillStyle = shipGrad;
  ctx.shadowColor = "#ff2244";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffaaaa";
  ctx.fill();
}

export function drawEnemyLaser(ctx: CanvasRenderingContext2D, laser: EnemyLaser) {
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "#ff4444";
  ctx.shadowBlur = 8;
  ctx.fillRect(laser.x - 2, laser.y, 4, 10);
  ctx.shadowBlur = 0;
}

// ─── Particles ───

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── HUD ───

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  score: number,
  lives: number,
  difficulty: number,
  player: PlayerState
) {
  ctx.save();

  // Background bar
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, w, 36);
  ctx.strokeStyle = "rgba(0, 180, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(w, 36);
  ctx.stroke();

  ctx.font = "bold 14px monospace";
  ctx.textBaseline = "middle";

  // Score
  ctx.fillStyle = "#00ccff";
  ctx.shadowColor = "#00ccff";
  ctx.shadowBlur = 6;
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${score}`, 12, 18);

  // Lives
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "#ff4444";
  ctx.textAlign = "center";
  let livesStr = "";
  for (let i = 0; i < lives; i++) livesStr += "♥ ";
  ctx.fillText(livesStr.trim(), w / 2, 18);

  // Difficulty
  ctx.fillStyle = "#ffcc00";
  ctx.shadowColor = "#ffcc00";
  ctx.textAlign = "right";
  ctx.fillText(`LVL ${difficulty}`, w - 12, 18);

  ctx.shadowBlur = 0;

  // Active power-ups bar
  const activePowerUps: { label: string; color: string; timer: number }[] = [];
  if (player.rapidFireActive) activePowerUps.push({ label: "RAPID", color: "#ff4444", timer: player.rapidFireTimer });
  if (player.shieldActive) activePowerUps.push({ label: "SHIELD", color: "#00ffcc", timer: player.shieldTimer });
  if (player.slowMotionActive) activePowerUps.push({ label: "SLOW", color: "#8844ff", timer: player.slowMotionTimer });
  if (player.doubleScoreActive) activePowerUps.push({ label: "2x", color: "#ffcc00", timer: player.doubleScoreTimer });

  if (activePowerUps.length > 0) {
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    const startX = w / 2 - (activePowerUps.length * 52) / 2;
    activePowerUps.forEach((pu, i) => {
      const px = startX + i * 52 + 26;
      ctx.fillStyle = pu.color;
      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 4;
      ctx.fillText(pu.label, px, 50);
      // Timer bar
      const barW = 40;
      const barH = 3;
      const pct = Math.min(pu.timer / 5000, 1);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(px - barW / 2, 56, barW, barH);
      ctx.fillStyle = pu.color;
      ctx.fillRect(px - barW / 2, 56, barW * pct, barH);
    });
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
