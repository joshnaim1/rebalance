// Shared Canvas rendering utilities for BalanceBack games — night sky theme

export const COLORS = {
  skyTop: '#0B1120',
  skyMid: '#111B33',
  skyBottom: '#1A2744',
  horizon: '#1E3355',
  star: '#FFFFFF',
  starDim: '#A0B4D0',
  player: '#4ADE80',
  playerGlow: '#4ADE80',
  playerCore: '#86EFAC',
  targetRing: '#60A5FA',
  progressArc: '#60A5FA',
  progressArcDone: '#4ADE80',
  obstacle: '#1E3355',
  obstacleEdge: '#60A5FA',
  gapZone: 'rgba(74, 222, 128, 0.12)',
  collisionFlash: 'rgba(248, 113, 113, 0.3)',
  hudText: '#F1F5F9',
  hudSecondary: '#94A3B8',
  guideLine: '#334155',
  scorePopup: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  platform: '#1E3355',
  platformEdge: '#60A5FA',
  balanceBar: '#1E293B',
  balanceBarTrack: '#334155',
};

export function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

export function drawGradientBackground(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(0.5, COLORS.skyMid);
  grad.addColorStop(0.85, COLORS.skyBottom);
  grad.addColorStop(1, COLORS.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function createStarField(count, w, h) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5 + 0.3,
      baseOpacity: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 3 + 1,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export function drawStarField(ctx, stars, time) {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
    const opacity = s.baseOpacity * twinkle;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = s.radius > 1 ? COLORS.star : COLORS.starDim;
    ctx.globalAlpha = opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Kept for compatibility — wraps star field as drifting particles
export function createBackgroundParticles(count, w, h) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.3 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      opacity: Math.random() * 0.4 + 0.2,
    });
  }
  return particles;
}

export function updateAndDrawParticles(ctx, particles, w, h) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.star;
    ctx.globalAlpha = p.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawTrail(ctx, positions, color, maxRadius) {
  for (let i = 0; i < positions.length; i++) {
    const t = i / positions.length;
    const pos = positions[i];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, maxRadius * t * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = t * 0.35;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createParticleBurst(x, y, count, color) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 150 + 80;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 3 + 2,
      opacity: 1,
      color,
      life: 0,
      maxLife: 0.5 + Math.random() * 0.2,
    });
  }
  return particles;
}

export function updateAndDrawBurstParticles(ctx, particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.opacity = 1 - p.life / p.maxLife;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.opacity, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawScorePopup(ctx, popup, dt) {
  popup.age += dt;
  const progress = popup.age / 0.8;
  if (progress >= 1) return false;
  const alpha = 1 - progress;
  const offsetY = progress * 50;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.scorePopup;
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(popup.text, popup.x, popup.y - offsetY);
  ctx.globalAlpha = 1;
  return true;
}
