import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useHiDPICanvas } from '../hooks/useHiDPICanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  COLORS, lerp, drawGradientBackground, createStarField, drawStarField,
  createParticleBurst, updateAndDrawBurstParticles,
} from '../utils/gameRenderer';

const CANVAS_W = 400;
const CANVAS_H = 600;
const PLAYER_W = 30;
const PLAYER_H = 30;
const PLATFORM_W = 120;
const PLATFORM_H = 18;
const PLATFORM_COUNT = 7;
const GRAVITY = 600;
const JUMP_VELOCITY = -480;
const MAX_TIME = 120;
const PLATFORM_SPACING = 75;

export default function DoodleJumpGame({ balance, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [gameStats, setGameStats] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('balanceback_doodle_highscore') || '0', 10); }
    catch { return 0; }
  });

  const reducedMotion = useReducedMotion();
  const containerRef = useHiDPICanvas(canvasRef, CANVAS_W, CANVAS_H);
  const stateRef = useRef(null);
  const balanceRef = useRef(balance);
  const starsRef = useRef(null);
  const keyboardOffsetRef = useRef(0);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const STEP = 8;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyboardOffsetRef.current = Math.max(keyboardOffsetRef.current - STEP, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyboardOffsetRef.current = Math.min(keyboardOffsetRef.current + STEP, 1);
      }
    };
    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        keyboardOffsetRef.current = 0;
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const initState = useCallback(() => {
    const platforms = [];
    // Starting platform directly under player
    platforms.push({
      x: CANVAS_W / 2 - PLATFORM_W / 2,
      y: CANVAS_H - 60,
    });
    for (let i = 1; i < PLATFORM_COUNT; i++) {
      platforms.push({
        x: Math.random() * (CANVAS_W - PLATFORM_W),
        y: CANVAS_H - 60 - PLATFORM_SPACING * i,
      });
    }
    return {
      playerX: CANVAS_W / 2 - PLAYER_W / 2,
      playerY: CANVAS_H - 60 - PLAYER_H,
      velocityY: JUMP_VELOCITY,
      velocityX: 0,
      platforms,
      score: 0,
      maxHeight: 0,
      elapsed: 0,
      bursts: [],
      popups: [],
      platformsPassed: 0,
      gameOver: false,
    };
  }, []);

  function startGame() {
    stateRef.current = initState();
    starsRef.current = createStarField(100, CANVAS_W, CANVAS_H);
    setScore(0);
    setGameStats(null);
    keyboardOffsetRef.current = 0;
    setGameState('playing');
  }

  /* eslint-disable react-hooks/purity */
  function gameLoop(dt) {
    const s = stateRef.current;
    const b = balanceRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !s || s.gameOver) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / CANVAS_W, canvas.height / CANVAS_H);

    // Horizontal movement from balance ratio
    // ratio 0 = full left, 0.5 = center, 1 = full right
    const balanceForce = (b.ratio - 0.5) * 2;
    const targetVX = (balanceForce + keyboardOffsetRef.current) * 350;
    s.velocityX = lerp(s.velocityX, targetVX, 0.12);

    // Apply physics
    s.velocityY += GRAVITY * dt;
    s.playerX += s.velocityX * dt;
    s.playerY += s.velocityY * dt;

    // Wrap horizontally
    if (s.playerX + PLAYER_W < 0) s.playerX = CANVAS_W;
    if (s.playerX > CANVAS_W) s.playerX = -PLAYER_W;

    // Scroll world up when player is above middle
    const scrollThreshold = CANVAS_H * 0.4;
    if (s.playerY < scrollThreshold) {
      const shift = scrollThreshold - s.playerY;
      s.playerY = scrollThreshold;
      for (let i = 0; i < s.platforms.length; i++) {
        s.platforms[i].y += shift;
      }
      s.maxHeight += shift;
      s.score = Math.floor(s.maxHeight / 10);
      setScore(s.score);
    }

    // Platform collision (only when falling)
    if (s.velocityY >= 0) {
      for (let i = 0; i < s.platforms.length; i++) {
        const plat = s.platforms[i];
        if (
          s.playerX + PLAYER_W > plat.x &&
          s.playerX < plat.x + PLATFORM_W &&
          s.playerY + PLAYER_H >= plat.y &&
          s.playerY + PLAYER_H <= plat.y + PLATFORM_H + s.velocityY * dt + 5
        ) {
          s.velocityY = JUMP_VELOCITY;
          s.platformsPassed++;
          if (!reducedMotion && s.platformsPassed % 5 === 0) {
            s.bursts.push(...createParticleBurst(
              s.playerX + PLAYER_W / 2, plat.y, 10, COLORS.playerGlow
            ));
          }
        }
      }
    }

    // Remove platforms that scrolled off bottom and add new ones on top
    s.platforms = s.platforms.filter(p => p.y < CANVAS_H + 20);
    while (s.platforms.length < PLATFORM_COUNT) {
      let topY = Math.min(...s.platforms.map(p => p.y));
      s.platforms.push({
        x: Math.random() * (CANVAS_W - PLATFORM_W),
        y: topY - PLATFORM_SPACING - Math.random() * 20,
      });
    }

    // Fall off bottom = game over
    if (s.playerY > CANVAS_H + 50) {
      s.gameOver = true;
      finishGame(s);
      return;
    }

    s.elapsed += dt;
    if (s.elapsed >= MAX_TIME) {
      s.gameOver = true;
      finishGame(s);
      return;
    }

    // --- Draw ---
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);
    drawStarField(ctx, starsRef.current, s.elapsed);

    // Platforms — rounded, soft with glowing edges
    for (let i = 0; i < s.platforms.length; i++) {
      const plat = s.platforms[i];
      ctx.shadowColor = COLORS.platformEdge;
      ctx.shadowBlur = 6;
      ctx.fillStyle = COLORS.platform;
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, PLATFORM_W, PLATFORM_H, 9);
      ctx.fill();
      ctx.strokeStyle = COLORS.platformEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Player — glowing orb
    const px = s.playerX + PLAYER_W / 2;
    const py = s.playerY + PLAYER_H / 2;
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_W / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.playerGlow;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_W / 2 * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Direction indicator (small triangle showing velocity direction)
    if (Math.abs(s.velocityX) > 30) {
      const dir = s.velocityX > 0 ? 1 : -1;
      ctx.fillStyle = COLORS.playerGlow;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(px + dir * (PLAYER_W / 2 + 4), py);
      ctx.lineTo(px + dir * (PLAYER_W / 2 - 2), py - 5);
      ctx.lineTo(px + dir * (PLAYER_W / 2 - 2), py + 5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

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

    // HUD: Score
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score}`, CANVAS_W - 20, 35);
    ctx.fillStyle = COLORS.hudSecondary;
    ctx.font = '13px system-ui';
    ctx.fillText('HEIGHT', CANVAS_W - 20, 52);

    // HUD: Timer
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px system-ui';
    const timeLeft = Math.max(0, Math.ceil(MAX_TIME - s.elapsed));
    ctx.fillText(`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, 20, 35);

    // Balance indicator at bottom
    const barY = CANVAS_H - 20;
    const barW = CANVAS_W - 60;
    const barH = 4;
    const barX = 30;
    ctx.fillStyle = COLORS.balanceBarTrack;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();
    const indicatorX = barX + b.ratio * barW;
    ctx.fillStyle = COLORS.playerGlow;
    ctx.beginPath();
    ctx.arc(indicatorX, barY + barH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  /* eslint-enable react-hooks/purity */

  function finishGame(s) {
    const finalScore = s.score;
    setGameStats({
      score: finalScore,
      platformsPassed: s.platformsPassed,
      elapsed: Math.floor(s.elapsed),
    });
    setGameState('gameover');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('balanceback_doodle_highscore', String(finalScore));
    }
    if (onScoreUpdate) onScoreUpdate(finalScore);
  }

  useGameLoop(gameLoop, gameState === 'playing');

  useEffect(() => {
    if (gameState === 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / CANVAS_W, canvas.height / CANVAS_H);
    drawGradientBackground(ctx, CANVAS_W, CANVAS_H);

    if (gameState === 'ready') {
      ctx.fillStyle = COLORS.hudSecondary;
      ctx.font = '18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Shift weight to jump higher', CANVAS_W / 2, CANVAS_H / 2);
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
              {gameState === 'gameover' ? 'Play Again' : 'Start Game'}
            </button>
          )}
          {gameState === 'gameover' && (
            <span className="text-[#DC2626] font-medium">
              Game Over — Height: {score}
            </span>
          )}
        </div>
        <div className="text-[#6B7280] text-sm">
          High Score: <span className="text-[#1E293B] font-mono font-bold">{highScore}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-[#E8E5E0] mx-auto"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-6 text-sm text-[#6B7280]">
          <span>Lean left/right to move</span>
          <span>Land on platforms to jump higher</span>
        </div>
      )}

      {gameState === 'gameover' && gameStats && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 space-y-3"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[#1E293B] font-semibold text-lg">Jump Complete</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2D9C6F]">{gameStats.score}</div>
              <div className="text-xs text-[#6B7280]">Max Height</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E293B]">{gameStats.platformsPassed}</div>
              <div className="text-xs text-[#6B7280]">Platforms Landed</div>
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
              <span className="text-[#2D9C6F]">&#9664;&#9654;</span>
              <span>Lean left/right on your balance board to steer (or use arrow keys / A/D)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2563EB]">&#9650;</span>
              <span>Land on platforms to bounce higher — you jump automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626]">&#9660;</span>
              <span>Don't fall off the bottom — keep climbing!</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
