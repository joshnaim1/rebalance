import { useState, useRef, useEffect } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';

const CANVAS_W = 800;
const CANVAS_H = 500;
const PLAYER_SIZE = 28;
const OBSTACLE_W = 50;
const GAP_H = 140;
const OBSTACLE_SPEED = 150;
const SPAWN_INTERVAL = 2.0;
const MAX_HITS = 3;
const MAX_TIME = 120;

function createInitialState() {
  return {
    playerY: CANVAS_H / 2,
    obstacles: [],
    spawnTimer: SPAWN_INTERVAL * 0.6,
    elapsed: 0,
    scoreAccum: 0,
    hits: 0,
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
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('balanceback_game_highscore') || '0', 10); }
    catch { return 0; }
  });

  const gsRef = useRef(createInitialState());
  const balanceRef = useRef(balance);
  const highScoreRef = useRef(highScore);
  const onScoreUpdateRef = useRef(onScoreUpdate);

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);
  useEffect(() => { onScoreUpdateRef.current = onScoreUpdate; }, [onScoreUpdate]);

  function startGame() {
    gsRef.current = createInitialState();
    setScore(0);
    setHits(0);
    setGameState('playing');
  }

  function handleGameOver(finalScore) {
    setGameState('over');
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('balanceback_game_highscore', String(finalScore));
    }
    if (onScoreUpdateRef.current) onScoreUpdateRef.current(finalScore);
  }

  function gameLoop(dt) {
    const s = gsRef.current;
    const b = balanceRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const targetY = b.ratio * (CANVAS_H - PLAYER_SIZE * 2) + PLAYER_SIZE;
    s.playerY += (targetY - s.playerY) * 0.15;

    s.spawnTimer += dt;
    if (s.spawnTimer >= SPAWN_INTERVAL) {
      s.spawnTimer = 0;
      const gapY = Math.random() * (CANVAS_H - GAP_H - 60) + 30;
      s.obstacles.push({ x: CANVAS_W, gapY, scored: false, hit: false });
    }

    for (let i = 0; i < s.obstacles.length; i++) {
      s.obstacles[i].x -= OBSTACLE_SPEED * dt;
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
          setHits(s.hits);
          if (s.hits >= MAX_HITS) {
            handleGameOver(Math.floor(s.scoreAccum));
            return;
          }
        }
      }
      if (!obs.scored && obs.x + OBSTACLE_W < px) {
        obs.scored = true;
      }
    }

    s.elapsed += dt;
    s.scoreAccum += dt;
    const currentScore = Math.floor(s.scoreAccum);
    setScore(currentScore);

    if (s.elapsed >= MAX_TIME) {
      handleGameOver(currentScore);
      return;
    }

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

    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${currentScore}`, 15, 30);
    ctx.textAlign = 'right';
    const timeLeft = Math.max(0, Math.ceil(MAX_TIME - s.elapsed));
    ctx.fillText(`Time: ${timeLeft}s`, CANVAS_W - 15, 30);

    ctx.textAlign = 'center';
    for (let i = 0; i < MAX_HITS; i++) {
      ctx.fillStyle = i < s.hits ? '#F87171' : '#334155';
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2 - 30 + i * 30, 25, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  useGameLoop(gameLoop, gameState === 'playing');

  useEffect(() => {
    if (gameState !== 'idle' && gameState !== 'over') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawBackground(ctx);
  }, [gameState]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {gameState !== 'playing' && (
            <button
              onClick={startGame}
              className="px-5 py-2.5 rounded-lg bg-balanced text-bg font-semibold
                         hover:bg-balanced/90 transition-colors"
            >
              {gameState === 'over' ? 'Play Again' : 'Start Game'}
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

      <div className="rounded-xl overflow-hidden border border-card-border">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-center gap-6 text-sm text-text-muted">
          <span>Lean left/right to move the ball</span>
          <span>Dodge through the gaps</span>
          <span>{MAX_HITS - hits} hits remaining</span>
        </div>
      )}

      {gameState === 'idle' && (
        <p className="text-center text-text-muted">
          Shift your weight left and right to steer the ball through gaps. Survive as long as you can!
        </p>
      )}
    </div>
  );
}
