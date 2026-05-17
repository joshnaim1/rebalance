import { useState, useRef, useEffect } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useReducedMotion } from '../hooks/useReducedMotion';
import SummaryCard from './SummaryCard';

const CANVAS_W = 800;
const CANVAS_H = 500;
const PLAYER_SIZE = 28;
const OBSTACLE_W = 50;
const GAP_H = 140;
const OBSTACLE_SPEED = 150;
const SPAWN_INTERVAL = 2.0;
const MAX_HITS = 3;
const MAX_TIME = 120;

const COMBO_MULTIPLIER_THRESHOLD = 5;
const COMBO_MULTIPLIER = 1.5;

function createInitialState() {
  return {
    playerY: CANVAS_H / 2,
    obstacles: [],
    spawnTimer: SPAWN_INTERVAL * 0.6,
    elapsed: 0,
    scoreAccum: 0,
    hits: 0,
    combo: 0,
    maxCombo: 0,
    obstaclesCleared: 0,
    popups: [],
  };
}

function drawBackground(ctx) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
}

export default function BalanceGame({ balance, onScoreUpdate }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announcements, setAnnouncements] = useState('');
  const [gameStats, setGameStats] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('balanceback_game_highscore') || '0', 10); }
    catch { return 0; }
  });

  const reducedMotion = useReducedMotion();
  const gsRef = useRef(createInitialState());
  const balanceRef = useRef(balance);
  const highScoreRef = useRef(highScore);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const lastMilestoneRef = useRef(0);
  const keyboardOffsetRef = useRef(0);

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);
  useEffect(() => { onScoreUpdateRef.current = onScoreUpdate; }, [onScoreUpdate]);

  // Keyboard fallback controls (ArrowLeft/ArrowRight and A/D)
  useEffect(() => {
    if (gameState !== 'playing' || paused) return;

    const KEYBOARD_STEP = 15;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keyboardOffsetRef.current = Math.max(keyboardOffsetRef.current - KEYBOARD_STEP, -(CANVAS_H / 2));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keyboardOffsetRef.current = Math.min(keyboardOffsetRef.current + KEYBOARD_STEP, CANVAS_H / 2);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyboardOffsetRef.current = Math.max(keyboardOffsetRef.current - KEYBOARD_STEP, -(CANVAS_H / 2));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyboardOffsetRef.current = Math.min(keyboardOffsetRef.current + KEYBOARD_STEP, CANVAS_H / 2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, paused]);

  function announce(message) {
    setAnnouncements(message);
  }

  function startGame() {
    gsRef.current = createInitialState();
    setScore(0);
    setHits(0);
    setShaking(false);
    setPaused(false);
    setGameStats(null);
    setAnnouncements('');
    lastMilestoneRef.current = 0;
    keyboardOffsetRef.current = 0;
    setGameState('playing');
    announce('Game started. Lean left and right to dodge obstacles.');
  }

  function triggerShake() {
    if (reducedMotion) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 200);
  }

  function togglePause() {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        announce('Game paused.');
      } else {
        announce('Game resumed.');
      }
      return next;
    });
  }

  function handleGameOver(finalScore, state) {
    setGameState('over');
    const newHigh = finalScore > highScoreRef.current;
    if (newHigh) {
      setHighScore(finalScore);
      localStorage.setItem('balanceback_game_highscore', String(finalScore));
    }

    const stats = {
      score: finalScore,
      time: Math.floor(state.elapsed),
      maxCombo: state.maxCombo,
      obstaclesCleared: state.obstaclesCleared,
      highScore: newHigh ? finalScore : highScoreRef.current,
      isNewHigh: newHigh,
    };
    setGameStats(stats);

    announce(`Game over. Final score: ${finalScore}. ${newHigh ? 'New high score!' : ''}`);

    if (onScoreUpdateRef.current) onScoreUpdateRef.current(finalScore);
  }

  function gameLoop(dt) {
    const s = gsRef.current;
    const b = balanceRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Apply keyboard offset to player position
    const targetY = b.ratio * (CANVAS_H - PLAYER_SIZE * 2) + PLAYER_SIZE + keyboardOffsetRef.current;
    s.playerY += (targetY - s.playerY) * 0.15;
    // Clamp player within canvas bounds
    s.playerY = Math.max(PLAYER_SIZE, Math.min(CANVAS_H - PLAYER_SIZE, s.playerY));

    // Speed increases by 10% every 30 seconds
    const speedMultiplier = 1 + Math.floor(s.elapsed / 30) * 0.1;
    // Reduced motion: reduce obstacle speed by 30%
    const motionFactor = reducedMotion ? 0.7 : 1.0;
    const effectiveSpeed = OBSTACLE_SPEED * speedMultiplier * motionFactor;

    s.spawnTimer += dt;
    if (s.spawnTimer >= SPAWN_INTERVAL) {
      s.spawnTimer = 0;
      const gapY = Math.random() * (CANVAS_H - GAP_H - 60) + 30;
      s.obstacles.push({ x: CANVAS_W, gapY, scored: false, hit: false });
    }

    for (let i = 0; i < s.obstacles.length; i++) {
      s.obstacles[i].x -= effectiveSpeed * dt;
    }

    s.obstacles = s.obstacles.filter((o) => o.x + OBSTACLE_W > -10);

    const px = 60;
    const py = s.playerY;
    for (let i = 0; i < s.obstacles.length; i++) {
      const obs = s.obstacles[i];
      if (obs.hit) continue;
      if (px + PLAYER_SIZE > obs.x && px < obs.x + OBSTACLE_W) {
        if (py - PLAYER_SIZE < obs.gapY || py + PLAYER_SIZE > obs.gapY + GAP_H) {
          obs.hit = true;
          s.hits++;
          s.combo = 0;
          setHits(s.hits);
          triggerShake();
          announce(`Collision! ${MAX_HITS - s.hits} hits remaining.`);
          if (s.hits >= MAX_HITS) {
            handleGameOver(Math.floor(s.scoreAccum), s);
            return;
          }
        }
      }
      if (!obs.scored && obs.x + OBSTACLE_W < px) {
        obs.scored = true;
        s.combo++;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        s.obstaclesCleared++;
        const multiplier = s.combo >= COMBO_MULTIPLIER_THRESHOLD ? COMBO_MULTIPLIER : 1.0;
        s.scoreAccum += multiplier;
        // Add floating popup
        s.popups.push({ x: obs.x + OBSTACLE_W, y: obs.gapY + GAP_H / 2, age: 0, text: '+1' });
      }
    }

    s.elapsed += dt;
    const currentScore = Math.floor(s.scoreAccum);
    setScore(currentScore);

    // Announce milestones every 10 points
    const milestone = Math.floor(currentScore / 10) * 10;
    if (milestone > 0 && milestone > lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      announce(`Score: ${milestone} points.`);
    }

    if (s.elapsed >= MAX_TIME) {
      handleGameOver(currentScore, s);
      return;
    }

    // Update popups
    s.popups = s.popups.filter((p) => {
      p.age += dt;
      return p.age < 0.6;
    });

    // --- Draw ---
    drawBackground(ctx);

    for (let i = 0; i < s.obstacles.length; i++) {
      const obs = s.obstacles[i];
      ctx.fillStyle = obs.hit ? '#F8717180' : '#334155';
      ctx.fillRect(obs.x, 0, OBSTACLE_W, obs.gapY);
      ctx.fillRect(obs.x, obs.gapY + GAP_H, OBSTACLE_W, CANVAS_H - obs.gapY - GAP_H);
      ctx.strokeStyle = obs.hit ? '#F87171' : '#4ADE8040';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.gapY, OBSTACLE_W, GAP_H);
    }

    const zoneColors = { balanced: '#4ADE80', warning: '#FBBF24', danger: '#F87171', idle: '#64748B' };
    const color = zoneColors[b.zone] || '#4ADE80';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_SIZE * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw floating score popups
    for (let i = 0; i < s.popups.length; i++) {
      const p = s.popups[i];
      const progress = p.age / 0.6;
      if (reducedMotion) {
        // Static text, no animation
        ctx.globalAlpha = progress < 0.3 ? 1 : 0;
        ctx.fillStyle = '#4ADE80';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      } else {
        const alpha = 1 - progress;
        const offsetY = progress * 40;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#4ADE80';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y - offsetY);
        ctx.globalAlpha = 1;
      }
    }

    // HUD: Score
    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${currentScore}`, 15, 30);

    // HUD: Time
    ctx.textAlign = 'right';
    const timeLeft = Math.max(0, Math.ceil(MAX_TIME - s.elapsed));
    ctx.fillText(`Time: ${timeLeft}s`, CANVAS_W - 15, 30);

    // HUD: Combo counter
    if (s.combo >= 2) {
      ctx.fillStyle = s.combo >= COMBO_MULTIPLIER_THRESHOLD ? '#FBBF24' : '#4ADE80';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'left';
      const comboText = `x${s.combo} Combo${s.combo >= COMBO_MULTIPLIER_THRESHOLD ? ' (1.5x)' : ''}`;
      ctx.fillText(comboText, 15, 55);
    }

    // HUD: Difficulty indicator
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${speedMultiplier.toFixed(1)}x`, CANVAS_W - 15, 55);

    // HUD: Hit indicators
    ctx.textAlign = 'center';
    for (let i = 0; i < MAX_HITS; i++) {
      ctx.fillStyle = i < s.hits ? '#F87171' : '#334155';
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2 - 30 + i * 30, 25, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  useGameLoop(gameLoop, gameState === 'playing' && !paused);

  useEffect(() => {
    if (gameState !== 'idle' && gameState !== 'over') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawBackground(ctx);
  }, [gameState]);

  // Draw "Paused" overlay when game is paused
  useEffect(() => {
    if (!paused || gameState !== 'playing') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Draw "Paused" text
    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused', CANVAS_W / 2, CANVAS_H / 2);
    ctx.textBaseline = 'alphabetic';
  }, [paused, gameState]);

  // Compute shake style
  const shakeStyle = shaking && !reducedMotion
    ? { transform: `translateX(${(Math.random() > 0.5 ? 1 : -1) * 5}px)` }
    : {};

  // Build summary card stats
  const summaryStats = gameStats ? [
    { label: 'Score', current: gameStats.score, previous: gameStats.highScore },
    { label: 'Time Survived', current: gameStats.time, previous: 0 },
    { label: 'Max Combo', current: gameStats.maxCombo, previous: 0 },
    { label: 'Obstacles Cleared', current: gameStats.obstaclesCleared, previous: 0 },
  ] : null;

  const summaryMessage = gameStats
    ? gameStats.isNewHigh
      ? `New high score! You beat your previous best of ${gameStats.highScore - Math.floor(gameStats.score > gameStats.highScore ? 0 : gameStats.highScore - gameStats.score)} points.`
      : `Your high score is ${gameStats.highScore}. Keep practicing to beat it!`
    : '';

  return (
    <div className="space-y-4">
      <h2 className="sr-only">Balance Game</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {gameState !== 'playing' && (
            <button
              onClick={startGame}
              className="px-5 py-3 rounded-lg bg-balanced text-bg font-semibold
                         hover:bg-balanced/90 transition-colors min-h-11"
            >
              {gameState === 'over' ? 'Play Again' : 'Start Game'}
            </button>
          )}
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-4 py-3 rounded-lg border border-card-border text-text-secondary font-medium
                         hover:bg-card transition-colors min-h-11"
              data-testid="game-pause-button"
              aria-label={paused ? 'Resume game' : 'Pause game'}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          {gameState === 'over' && (
            <span className="text-danger font-medium">
              Game Over — Score: {score}
            </span>
          )}
        </div>
        <div className="text-text-secondary text-sm">
          High Score: <span className="text-text-primary font-mono font-bold">{highScore}</span>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-card-border"
        style={shakeStyle}
        data-testid="game-canvas-wrapper"
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
        <div className="flex justify-center gap-6 text-sm text-text-secondary">
          <span>Lean left/right to move the ball</span>
          <span>Dodge through the gaps</span>
          <span>{MAX_HITS - hits} hits remaining</span>
        </div>
      )}

      {gameState === 'idle' && (
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3" data-testid="game-instruction-card">
          <h3 className="text-text font-semibold text-base">How to Play</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="text-balanced">◀▶</span>
              <span>Lean left and right on your balance board to steer the ball (or use arrow keys / A/D keys)</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="text-warning">⚠</span>
              <span>Dodge obstacles by moving through the gaps</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="text-balanced">⏱</span>
              <span>Survive as long as possible — the game lasts up to {MAX_TIME} seconds</span>
            </li>
          </ul>
          <p className="text-xs text-text-secondary border-t border-card-border pt-2">
            Build combos by clearing consecutive obstacles for bonus points!
          </p>
        </div>
      )}

      {gameState === 'over' && summaryStats && (
        <SummaryCard stats={summaryStats} message={summaryMessage} />
      )}

      {/* ARIA live region for game event announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="game-aria-live"
      >
        {announcements}
      </div>
    </div>
  );
}
