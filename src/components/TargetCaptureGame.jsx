import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useHiDPICanvas } from '../hooks/useHiDPICanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  COLORS, lerp, drawGradientBackground, createStarField, drawStarField,
  drawTrail, createParticleBurst, updateAndDrawBurstParticles,
} from '../utils/gameRenderer';

const CANVAS_W = 800;
const CANVAS_H = 400;
const PLAYER_RADIUS = 22;
const TARGET_RADIUS = 36;
const CAPTURE_DISTANCE = 40;
const BASE_HOLD_TIME = 2.0;
const MAX_TIME = 120;
const TRAIL_LENGTH = 15;

function getHoldDuration(score) {
  return Math.min(BASE_HOLD_TIME + score * 0.05, 3.0);
}

function getTargetX(score, canvasW) {
  const margin = 60;
  const maxSpread = Math.min(0.4 + score * 0.03, 0.9);
  const center = canvasW / 2;
  const range = (canvasW / 2 - margin) * maxSpread;
  const offset = (Math.random() * 2 - 1) * range;
  return center + offset;
}

export default function TargetCaptureGame({ balance, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [, setScore] = useState(0);
  const [gameStats, setGameStats] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('balanceback_target_highscore') || '0', 10); }
    catch { return 0; }
  });

  const reducedMotion = useReducedMotion();
  const containerRef = useHiDPICanvas(canvasRef, CANVAS_W, CANVAS_H);
  const stateRef = useRef(null);
  const balanceRef = useRef(balance);
  const starsRef = useRef(null);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  const initState = useCallback(() => {
    return {
      playerX: CANVAS_W / 2,
      targetX: getTargetX(0, CANVAS_W),
      holdProgress: 0,
      score: 0,
      elapsed: 0,
      trail: [],
      bursts: [],
      popups: [],
      captureCount: 0,
      totalCaptureTime: 0,
      bestStreak: 0,
      currentStreak: 0,
    };
  }, []);

  function startGame() {
    stateRef.current = initState();
    starsRef.current = createStarField(80, CANVAS_W, CANVAS_H);
    setScore(0);
    setGameStats(null);
    setGameState('playing');
  }

  /* eslint-disable react-hooks/purity */
  function gameLoop(dt) {
    const s = stateRef.current;
    const b = balanceRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !s) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / CANVAS_W, canvas.height / CANVAS_H);

    const targetX = b.ratio * (CANVAS_W - PLAYER_RADIUS * 4) + PLAYER_RADIUS * 2;
    s.playerX = lerp(s.playerX, targetX, 0.06);

    // Trail
    s.trail.push({ x: s.playerX, y: CANVAS_H / 2 });
    if (s.trail.length > TRAIL_LENGTH) s.trail.shift();

    // Hold logic
    const dist = Math.abs(s.playerX - s.targetX);
    const holdDuration = getHoldDuration(s.score);
    if (dist <= CAPTURE_DISTANCE) {
      s.holdProgress += dt;
      if (s.holdProgress >= holdDuration) {
        // Capture!
        s.score++;
        s.captureCount++;
        s.currentStreak++;
        s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
        s.totalCaptureTime += s.holdProgress;
        s.bursts.push(...createParticleBurst(s.targetX, CANVAS_H / 2, 22, COLORS.playerGlow));
        s.popups.push({ x: s.targetX, y: CANVAS_H / 2 - 30, age: 0, text: `+1` });
        s.targetX = getTargetX(s.score, CANVAS_W);
        s.holdProgress = 0;
        setScore(s.score);
      }
    } else {
      if (s.holdProgress > 0) s.currentStreak = 0;
      s.holdProgress = 0;
    }

    s.elapsed += dt;

    if (s.elapsed >= MAX_TIME) {
      finishGame(s);
      return;
    }

    // --- Draw ---
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);
    drawStarField(ctx, starsRef.current, s.elapsed);

    // Guide line
    ctx.strokeStyle = COLORS.guideLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, CANVAS_H / 2);
    ctx.lineTo(CANVAS_W - 40, CANVAS_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone markers
    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('LEFT', 60, CANVAS_H / 2 + 25);
    ctx.fillText('CENTER', CANVAS_W / 2, CANVAS_H / 2 + 25);
    ctx.fillText('RIGHT', CANVAS_W - 60, CANVAS_H / 2 + 25);

    // Target ring with pulsing glow
    const pulseSize = Math.sin(Date.now() * 0.004) * 4;
    const holdRatio = s.holdProgress / holdDuration;

    ctx.shadowColor = COLORS.targetRing;
    ctx.shadowBlur = 12 + pulseSize;
    ctx.strokeStyle = COLORS.targetRing;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.targetX, CANVAS_H / 2, TARGET_RADIUS + pulseSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Progress arc
    if (holdRatio > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + holdRatio * Math.PI * 2;
      const arcColor = holdRatio < 0.5
        ? COLORS.progressArc
        : lerpColor(COLORS.progressArc, COLORS.progressArcDone, (holdRatio - 0.5) * 2);
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = 5;
      ctx.shadowColor = arcColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.targetX, CANVAS_H / 2, TARGET_RADIUS + 8, startAngle, endAngle);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Trail
    if (!reducedMotion) {
      drawTrail(ctx, s.trail, COLORS.playerGlow, PLAYER_RADIUS);
    }

    // Player marker
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(s.playerX, CANVAS_H / 2, PLAYER_RADIUS, 0, Math.PI * 2);
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
      const alpha = 1 - progress;
      const offsetY = progress * 50;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.scorePopup;
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - offsetY);
      ctx.globalAlpha = 1;
      return true;
    });

    // HUD
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score}`, CANVAS_W - 20, 35);

    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '13px system-ui';
    ctx.fillText('SCORE', CANVAS_W - 20, 52);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px system-ui';
    const timeLeft = Math.max(0, Math.ceil(MAX_TIME - s.elapsed));
    ctx.fillText(`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, 20, 35);

    // Balance indicator bar at bottom
    const barY = CANVAS_H - 25;
    const barW = CANVAS_W - 80;
    const barH = 6;
    const barX = 40;
    ctx.fillStyle = COLORS.balanceBarTrack;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    const indicatorX = barX + b.ratio * barW;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(indicatorX, barY + barH / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    const leftPct = Math.round((1 - b.ratio) * 100);
    const rightPct = Math.round(b.ratio * 100);
    ctx.fillText(`LEFT ${leftPct}% — RIGHT ${rightPct}%`, CANVAS_W / 2, CANVAS_H - 6);
  }
  /* eslint-enable react-hooks/purity */

  function finishGame(s) {
    const finalScore = s.score;
    const avgTime = s.captureCount > 0
      ? (s.totalCaptureTime / s.captureCount).toFixed(1)
      : '—';
    setGameStats({
      score: finalScore,
      avgCaptureTime: avgTime,
      bestStreak: s.bestStreak,
      elapsed: Math.floor(s.elapsed),
    });
    setGameState('complete');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('balanceback_target_highscore', String(finalScore));
    }
    if (onScoreUpdate) onScoreUpdate(finalScore);
  }

  useGameLoop(gameLoop, gameState === 'playing');

  // Draw idle/complete state background
  useEffect(() => {
    if (gameState === 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / CANVAS_W, canvas.height / CANVAS_H);
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);

    if (gameState === 'ready') {
      const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = COLORS.hudSecondary;
      ctx.font = '18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Shift your weight to begin', CANVAS_W / 2, CANVAS_H / 2);
      ctx.globalAlpha = 1;
    }
  }, [gameState]);

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
              {gameState === 'complete' ? 'Play Again' : 'Start Training'}
            </button>
          )}
        </div>
        <div className="text-[#6B7280] text-sm">
          High Score: <span className="text-[#1E293B] font-mono font-bold">{highScore}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-[#E8E5E0]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-6 text-sm text-[#6B7280]">
          <span>Move onto the target and hold steady</span>
        </div>
      )}

      {gameState === 'complete' && gameStats && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 space-y-3"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[#1E293B] font-semibold text-lg">Training Complete</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2D9C6F]">{gameStats.score}</div>
              <div className="text-xs text-[#6B7280]">Targets Captured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E293B]">{gameStats.avgCaptureTime}s</div>
              <div className="text-xs text-[#6B7280]">Avg Capture Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2563EB]">{gameStats.bestStreak}</div>
              <div className="text-xs text-[#6B7280]">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E293B]">{gameStats.elapsed}s</div>
              <div className="text-xs text-[#6B7280]">Time</div>
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
              <span className="text-[#2D9C6F]">&#9679;</span>
              <span>Shift your weight to move the green marker left and right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2563EB]">&#9675;</span>
              <span>Move onto the blue target ring and hold steady for 2 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2D9C6F]">&#10003;</span>
              <span>Targets get further from center as you progress</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

function lerpColor(a, b, t) {
  const parse = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
