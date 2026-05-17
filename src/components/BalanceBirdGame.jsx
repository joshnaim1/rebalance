import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  COLORS, lerp, drawGradientBackground, createBackgroundParticles,
  updateAndDrawParticles, drawTrail, createParticleBurst,
  updateAndDrawBurstParticles,
} from '../utils/gameRenderer';

const CANVAS_W = 800;
const CANVAS_H = 500;
const PLAYER_RADIUS = 16;
const OBSTACLE_W = 50;
const INITIAL_GAP = 200;
const MIN_GAP = 120;
const BASE_SPEED = 140;
const SPAWN_INTERVAL = 2.2;
const MAX_LIVES = 3;
const MAX_TIME = 120;
const TRAIL_LENGTH = 12;
const RATIO_MIN = 0.3;
const RATIO_MAX = 0.7;

export default function BalanceBirdGame({ balance, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [shaking, setShaking] = useState(false);
  const [gameStats, setGameStats] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('balanceback_bird_highscore') || '0', 10); }
    catch { return 0; }
  });

  const reducedMotion = useReducedMotion();
  const stateRef = useRef(null);
  const balanceRef = useRef(balance);
  const particlesRef = useRef(null);
  const keyboardOffsetRef = useRef(0);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const STEP = 15;
    const handleKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keyboardOffsetRef.current = Math.max(keyboardOffsetRef.current - STEP, -(CANVAS_H / 2));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keyboardOffsetRef.current = Math.min(keyboardOffsetRef.current + STEP, CANVAS_H / 2);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  const initState = useCallback(() => ({
    playerY: CANVAS_H / 2,
    obstacles: [],
    spawnTimer: SPAWN_INTERVAL * 0.6,
    elapsed: 0,
    score: 0,
    lives: MAX_LIVES,
    trail: [],
    bursts: [],
    popups: [],
    flashTimer: 0,
    obstaclesCleared: 0,
  }), []);

  function startGame() {
    stateRef.current = initState();
    particlesRef.current = [
      createBackgroundParticles(20, CANVAS_W, CANVAS_H),
      createBackgroundParticles(15, CANVAS_W, CANVAS_H),
      createBackgroundParticles(10, CANVAS_W, CANVAS_H),
    ];
    setScore(0);
    setLives(MAX_LIVES);
    setShaking(false);
    keyboardOffsetRef.current = 0;
    setGameState('playing');
  }

  function triggerShake() {
    if (reducedMotion) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 200);
  }

  /* eslint-disable react-hooks/purity */
  function gameLoop(dt) {
    const s = stateRef.current;
    const b = balanceRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !s) return;

    // Map 0.3-0.7 ratio range to full screen height
    const clampedRatio = Math.max(RATIO_MIN, Math.min(RATIO_MAX, b.ratio));
    const normalizedRatio = (clampedRatio - RATIO_MIN) / (RATIO_MAX - RATIO_MIN);
    const targetY = normalizedRatio * (CANVAS_H - PLAYER_RADIUS * 4) + PLAYER_RADIUS * 2 + keyboardOffsetRef.current;
    s.playerY = lerp(s.playerY, targetY, 0.1);
    s.playerY = Math.max(PLAYER_RADIUS, Math.min(CANVAS_H - PLAYER_RADIUS, s.playerY));

    // Trail
    s.trail.push({ x: 80, y: s.playerY });
    if (s.trail.length > TRAIL_LENGTH) s.trail.shift();

    // Difficulty ramps
    const speedMultiplier = 1 + s.elapsed * 0.005;
    const motionFactor = reducedMotion ? 0.7 : 1.0;
    const effectiveSpeed = BASE_SPEED * speedMultiplier * motionFactor;
    const currentGap = Math.max(MIN_GAP, INITIAL_GAP - s.elapsed * 0.5);

    // Spawn obstacles
    s.spawnTimer += dt;
    if (s.spawnTimer >= SPAWN_INTERVAL) {
      s.spawnTimer = 0;
      const gapY = Math.random() * (CANVAS_H - currentGap - 80) + 40;
      s.obstacles.push({ x: CANVAS_W + OBSTACLE_W, gapY, gapH: currentGap, scored: false, hit: false });
    }

    // Move obstacles
    for (let i = 0; i < s.obstacles.length; i++) {
      s.obstacles[i].x -= effectiveSpeed * dt;
    }
    s.obstacles = s.obstacles.filter((o) => o.x + OBSTACLE_W > -10);

    // Collision detection
    const px = 80;
    const py = s.playerY;
    for (let i = 0; i < s.obstacles.length; i++) {
      const obs = s.obstacles[i];
      if (obs.hit) continue;
      if (px + PLAYER_RADIUS > obs.x && px - PLAYER_RADIUS < obs.x + OBSTACLE_W) {
        if (py - PLAYER_RADIUS < obs.gapY || py + PLAYER_RADIUS > obs.gapY + obs.gapH) {
          obs.hit = true;
          s.lives--;
          s.flashTimer = 0.15;
          setLives(s.lives);
          triggerShake();
          s.bursts.push(...createParticleBurst(px, py, 12, COLORS.danger));
          if (s.lives <= 0) {
            finishGame(s);
            return;
          }
        }
      }
      if (!obs.scored && obs.x + OBSTACLE_W < px - PLAYER_RADIUS) {
        obs.scored = true;
        s.score++;
        s.obstaclesCleared++;
        s.popups.push({ x: obs.x + OBSTACLE_W + 20, y: obs.gapY + obs.gapH / 2, age: 0, text: '+1' });
        setScore(s.score);
      }
    }

    s.elapsed += dt;
    if (s.flashTimer > 0) s.flashTimer -= dt;

    if (s.elapsed >= MAX_TIME) {
      finishGame(s);
      return;
    }

    // --- Draw ---
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);

    // 3-layer parallax particles
    const speeds = [0.3, 0.6, 1.0];
    for (let layer = 0; layer < 3; layer++) {
      const particles = particlesRef.current[layer];
      for (let i = 0; i < particles.length; i++) {
        particles[i].x -= effectiveSpeed * speeds[layer] * dt * 0.15;
        if (particles[i].x < 0) particles[i].x = CANVAS_W;
      }
      updateAndDrawParticles(ctx, particles, CANVAS_W, CANVAS_H);
    }

    // Speed lines (subtle horizontal streaks that increase with speed)
    if (!reducedMotion && speedMultiplier > 1.2) {
      const lineCount = Math.min(Math.floor((speedMultiplier - 1.2) * 10), 8);
      ctx.strokeStyle = COLORS.particle;
      ctx.lineWidth = 1;
      for (let i = 0; i < lineCount; i++) {
        const ly = (CANVAS_H / (lineCount + 1)) * (i + 1) + Math.sin(Date.now() * 0.01 + i) * 20;
        const lx = Math.random() * CANVAS_W * 0.6 + CANVAS_W * 0.2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 30 + speedMultiplier * 15, ly);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Obstacles — sleek gradient barriers with glowing edges
    for (let i = 0; i < s.obstacles.length; i++) {
      const obs = s.obstacles[i];

      // Top barrier
      const topGrad = ctx.createLinearGradient(obs.x, 0, obs.x + OBSTACLE_W, 0);
      topGrad.addColorStop(0, obs.hit ? '#FECACA' : COLORS.obstacle);
      topGrad.addColorStop(1, obs.hit ? '#FCA5A5' : '#C5DCF0');
      ctx.fillStyle = topGrad;
      ctx.fillRect(obs.x, 0, OBSTACLE_W, obs.gapY);

      // Bottom barrier
      ctx.fillStyle = topGrad;
      ctx.fillRect(obs.x, obs.gapY + obs.gapH, OBSTACLE_W, CANVAS_H - obs.gapY - obs.gapH);

      // Glowing edges
      ctx.shadowColor = obs.hit ? COLORS.danger : COLORS.obstacleEdge;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = obs.hit ? COLORS.danger : COLORS.obstacleEdge;
      ctx.lineWidth = 2;
      // Top barrier bottom edge
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.gapY);
      ctx.lineTo(obs.x + OBSTACLE_W, obs.gapY);
      ctx.stroke();
      // Bottom barrier top edge
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.gapY + obs.gapH);
      ctx.lineTo(obs.x + OBSTACLE_W, obs.gapY + obs.gapH);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Gap zone highlight
      if (!obs.hit) {
        ctx.fillStyle = COLORS.gapZone;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(obs.x, obs.gapY, OBSTACLE_W, obs.gapH);
        ctx.globalAlpha = 1;
      }
    }

    // Trail
    if (!reducedMotion) {
      drawTrail(ctx, s.trail, COLORS.playerGlow, PLAYER_RADIUS);
    }

    // Player orb
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core
    ctx.fillStyle = COLORS.playerGlow;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_RADIUS * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Burst particles
    if (!reducedMotion) {
      updateAndDrawBurstParticles(ctx, s.bursts, dt);
    }

    // Score popups
    s.popups = s.popups.filter((p) => {
      p.age += dt;
      if (p.age >= 0.8) return false;
      const progress = p.age / 0.8;
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = COLORS.scorePopup;
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - progress * 40);
      ctx.globalAlpha = 1;
      return true;
    });

    // Collision flash overlay
    if (s.flashTimer > 0) {
      ctx.fillStyle = COLORS.collisionFlash;
      ctx.globalAlpha = s.flashTimer / 0.15 * 0.4;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    }

    // HUD: Score
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score}`, CANVAS_W - 20, 35);
    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '13px system-ui';
    ctx.fillText('SCORE', CANVAS_W - 20, 52);

    // HUD: Timer
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px system-ui';
    const timeLeft = Math.max(0, Math.ceil(MAX_TIME - s.elapsed));
    ctx.fillText(`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, 20, 35);

    // HUD: Lives as green dots
    for (let i = 0; i < MAX_LIVES; i++) {
      ctx.fillStyle = i < s.lives ? COLORS.playerGlow : '#E8E5E0';
      ctx.beginPath();
      ctx.arc(20 + i * 22, 55, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD: Speed indicator
    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${speedMultiplier.toFixed(1)}x`, CANVAS_W - 20, CANVAS_H - 15);
  }
  /* eslint-enable react-hooks/purity */

  function finishGame(s) {
    const finalScore = s.score;
    setGameStats({
      score: finalScore,
      obstaclesCleared: s.obstaclesCleared,
      elapsed: Math.floor(s.elapsed),
    });
    setGameState('gameover');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('balanceback_bird_highscore', String(finalScore));
    }
    if (onScoreUpdate) onScoreUpdate(finalScore);
  }

  useGameLoop(gameLoop, gameState === 'playing');

  useEffect(() => {
    if (gameState === 'playing') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);

    if (gameState === 'ready') {
      ctx.fillStyle = COLORS.hudSecondary;
      ctx.font = '18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Shift weight to fly', CANVAS_W / 2, CANVAS_H / 2);
    }
  }, [gameState]);

  const shakeStyle = shaking && !reducedMotion
    ? { transform: `translateX(${shaking ? -4 : 4}px)` }
    : {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {gameState !== 'playing' && (
            <button
              onClick={startGame}
              className="px-5 py-2.5 rounded-lg border-2 border-[#2D9C6F] text-[#2D9C6F] bg-white font-semibold
                         hover:bg-[#E8F8EF] transition-colors"
            >
              {gameState === 'gameover' ? 'Play Again' : 'Start Game'}
            </button>
          )}
          {gameState === 'gameover' && (
            <span className="text-[#DC2626] font-medium">
              Game Over — Score: {score}
            </span>
          )}
        </div>
        <div className="text-[#6B7280] text-sm">
          High Score: <span className="text-[#1E293B] font-mono font-bold">{highScore}</span>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-[#E8E5E0]"
        style={{ ...shakeStyle, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-6 text-sm text-[#6B7280]">
          <span>Lean to move up and down</span>
          <span>Navigate through the gaps</span>
          <span>{lives} {lives === 1 ? 'life' : 'lives'} remaining</span>
        </div>
      )}

      {gameState === 'gameover' && gameStats && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 space-y-3"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[#1E293B] font-semibold text-lg">Flight Complete</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2D9C6F]">{gameStats.score}</div>
              <div className="text-xs text-[#6B7280]">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E293B]">{gameStats.obstaclesCleared}</div>
              <div className="text-xs text-[#6B7280]">Obstacles Cleared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E293B]">{gameStats.elapsed}s</div>
              <div className="text-xs text-[#6B7280]">Time Survived</div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'ready' && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 space-y-3"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[#1E293B] font-semibold text-base">How to Play</h3>
          <ul className="space-y-2 text-sm text-[#6B7280]">
            <li className="flex items-start gap-2">
              <span className="text-[#2D9C6F]">&#9650;&#9660;</span>
              <span>Lean left/right on your balance board to fly up and down (or use arrow keys / W/S)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2563EB]">&#9644;</span>
              <span>Navigate through the gaps between the barriers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626]">&#9679;</span>
              <span>You have 3 lives — collisions cost one life</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
