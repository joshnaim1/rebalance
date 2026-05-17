// Shared Canvas rendering utilities for BalanceBack games — light sky-blue theme

export const COLORS = {
  gradientTop: '#E8F4FD',
  gradientBottom: '#F5FAFF',
  particle: '#B8D4E8',
  player: '#2D9C6F',
  playerGlow: '#4ADE80',
  targetRing: '#2563EB',
  progressArc: '#2563EB',
  progressArcDone: '#2D9C6F',
  obstacle: '#D1E5F4',
  obstacleEdge: '#60A5FA',
  gapZone: '#D4EDDA',
  collisionFlash: '#FEE2E2',
  hudText: '#1E293B',
  hudSecondary: '#6B7280',
  guideLine: '#CBD5E1',
  scorePopup: '#2D9C6F',
  danger: '#DC2626',
  warning: '#D97706',
};

export function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

export function drawGradientBackground(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COLORS.gradientTop);
  grad.addColorStop(1, COLORS.gradientBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function createBackgroundParticles(count, w, h) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.15 + 0.25,
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
    ctx.fillStyle = COLORS.particle;
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
    ctx.globalAlpha = t * 0.4;
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
