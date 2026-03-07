"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const GRAVITY = 0.5;
const JUMP_FORCE = -9;
const PIPE_SPEED = 3;
const PIPE_GAP = 160;
const PIPE_WIDTH = 60;
const PIPE_SPAWN_INTERVAL = 1600;
const BIRD_X = 100;
const BIRD_SIZE = 34;

type GameState = "idle" | "playing" | "dead";

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

interface Bird {
  y: number;
  vy: number;
  rotation: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Body
  const grad = ctx.createRadialGradient(-2, -2, 2, 0, 0, BIRD_SIZE / 2);
  grad.addColorStop(0, "#FFE033");
  grad.addColorStop(1, "#F5A623");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  ctx.fillStyle = "#F5A623";
  ctx.beginPath();
  ctx.ellipse(-2, 4, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -5, 7, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(11, -6.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#FF8C00";
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(22, 0);
  ctx.lineTo(14, 3);
  ctx.closePath();
  ctx.fill();

  // Beak line
  ctx.strokeStyle = "#cc6600";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();

  ctx.restore();
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  topHeight: number,
  canvasHeight: number
) {
  const bottomY = topHeight + PIPE_GAP;
  const bottomHeight = canvasHeight - bottomY;

  const drawSinglePipe = (py: number, ph: number, flipped: boolean) => {
    const capH = 24;
    const capW = PIPE_WIDTH + 12;
    const bodyX = x + 6;
    const capX = x;

    // Pipe body gradient
    const bodyGrad = ctx.createLinearGradient(bodyX, 0, bodyX + PIPE_WIDTH - 12, 0);
    bodyGrad.addColorStop(0, "#2ecc40");
    bodyGrad.addColorStop(0.3, "#5cda6a");
    bodyGrad.addColorStop(0.7, "#27ae60");
    bodyGrad.addColorStop(1, "#1a7a3f");

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(bodyX, py, PIPE_WIDTH - 12, ph, 4);
    ctx.fill();

    // Pipe cap
    const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGrad.addColorStop(0, "#27ae60");
    capGrad.addColorStop(0.3, "#58d68d");
    capGrad.addColorStop(0.7, "#239b56");
    capGrad.addColorStop(1, "#145a32");

    ctx.fillStyle = capGrad;
    const capY = flipped ? py + ph - capH : py;
    ctx.beginPath();
    ctx.roundRect(capX, capY, capW, capH, 6);
    ctx.fill();

    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.roundRect(bodyX + 4, py + 2, 8, ph - 4, 3);
    ctx.fill();
  };

  // Top pipe
  drawSinglePipe(0, topHeight, true);
  // Bottom pipe
  drawSinglePipe(bottomY, bottomHeight, false);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number
) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, "#1a1a4e");
  skyGrad.addColorStop(0.5, "#0d3b8e");
  skyGrad.addColorStop(1, "#1565c0");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const stars = [
    [50, 30, 1.5], [120, 60, 1], [200, 20, 2], [280, 80, 1.5],
    [350, 40, 1], [430, 70, 1.5], [80, 100, 1], [160, 45, 2],
    [240, 90, 1], [320, 25, 1.5], [400, 55, 1], [460, 85, 2],
    [30, 75, 1.5], [100, 15, 1], [180, 65, 2], [260, 35, 1],
    [340, 95, 1.5], [420, 10, 1], [70, 50, 2], [150, 85, 1],
  ];
  stars.forEach(([sx, sy, r]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ground
  const groundY = height - 60;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
  groundGrad.addColorStop(0, "#8B4513");
  groundGrad.addColorStop(0.3, "#A0522D");
  groundGrad.addColorStop(1, "#6B3410");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, width, 60);

  // Ground grass stripe
  const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 16);
  grassGrad.addColorStop(0, "#4CAF50");
  grassGrad.addColorStop(1, "#388E3C");
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, groundY, width, 16);

  // Moving ground dots
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for (let i = 0; i < Math.ceil(width / 40) + 1; i++) {
    const dotX = ((i * 40 - offset) % width + width) % width;
    ctx.beginPath();
    ctx.arc(dotX, groundY + 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
  ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.3, cloud.size * 0.7, 0, Math.PI * 2);
  ctx.arc(cloud.x + cloud.size * 1.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
  ctx.fill();
}

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>("idle");
  const birdRef = useRef<Bird>({ y: 0, vy: 0, rotation: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const lastPipeTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const cloudsRef = useRef<Cloud[]>([]);
  const lastTimeRef = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [scoreAnim, setScoreAnim] = useState(false);

  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext("2d");

  const GROUND_Y = useCallback(() => {
    const canvas = getCanvas();
    return canvas ? canvas.height - 60 : 500;
  }, []);

  const initGame = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    birdRef.current = { y: canvas.height / 2 - 20, vy: 0, rotation: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    groundOffsetRef.current = 0;
    lastPipeTimeRef.current = 0;
    setDisplayScore(0);

    // Init clouds
    cloudsRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: (i * canvas.width) / 4,
      y: 50 + Math.random() * 120,
      size: 25 + Math.random() * 20,
      speed: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  const jump = useCallback(() => {
    if (gameStateRef.current === "dead") return;
    if (gameStateRef.current === "idle") {
      gameStateRef.current = "playing";
      setGameState("playing");
    }
    birdRef.current.vy = JUMP_FORCE;
  }, []);

  const handleInput = useCallback(
    (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if ("key" in e && e.key !== " " && e.key !== "ArrowUp") return;
      e.preventDefault();
      if (gameStateRef.current === "dead") {
        gameStateRef.current = "idle";
        setGameState("idle");
        initGame();
        return;
      }
      jump();
    },
    [jump, initGame]
  );

  const checkCollision = useCallback(
    (bird: Bird, pipes: Pipe[], canvasWidth: number, groundY: number) => {
      const bx = BIRD_X;
      const by = bird.y;
      const br = BIRD_SIZE / 2 - 4; // slight forgiveness

      if (by + br >= groundY || by - br <= 0) return true;

      for (const pipe of pipes) {
        const px = pipe.x;
        if (bx + br > px && bx - br < px + PIPE_WIDTH) {
          if (by - br < pipe.topHeight || by + br > pipe.topHeight + PIPE_GAP) {
            return true;
          }
        }
      }
      return false;
    },
    []
  );

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = getCanvas();
      const ctx = getCtx();
      if (!canvas || !ctx) return;

      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 16.67, 3) : 1;
      lastTimeRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;
      const groundY = H - 60;

      // Draw background
      drawBackground(ctx, W, H, groundOffsetRef.current);

      // Update & draw clouds
      cloudsRef.current.forEach((cloud) => {
        cloud.x -= cloud.speed * dt;
        if (cloud.x + cloud.size * 2.5 < 0) {
          cloud.x = W + cloud.size;
          cloud.y = 50 + Math.random() * 120;
        }
        drawCloud(ctx, cloud);
      });

      if (gameStateRef.current === "playing") {
        // Update ground offset
        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED * dt) % 40;

        // Update bird physics
        birdRef.current.vy += GRAVITY * dt;
        birdRef.current.y += birdRef.current.vy * dt;
        birdRef.current.rotation = Math.max(-30, Math.min(90, birdRef.current.vy * 5));

        // Spawn pipes
        if (!lastPipeTimeRef.current || timestamp - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
          const minTop = 60;
          const maxTop = groundY - PIPE_GAP - 60;
          const topHeight = minTop + Math.random() * (maxTop - minTop);
          pipesRef.current.push({ x: W, topHeight, passed: false });
          lastPipeTimeRef.current = timestamp;
        }

        // Update pipes
        pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > -10);
        for (const pipe of pipesRef.current) {
          pipe.x -= PIPE_SPEED * dt;
          if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.passed = true;
            scoreRef.current += 1;
            bestScoreRef.current = Math.max(bestScoreRef.current, scoreRef.current);
            setDisplayScore(scoreRef.current);
            setDisplayBest(bestScoreRef.current);
            setScoreAnim(true);
            setTimeout(() => setScoreAnim(false), 200);
          }
        }

        // Check collision
        if (checkCollision(birdRef.current, pipesRef.current, W, groundY)) {
          gameStateRef.current = "dead";
          setGameState("dead");
        }
      } else if (gameStateRef.current === "idle") {
        // Idle bobbing
        birdRef.current.y = H / 2 - 20 + Math.sin(timestamp / 400) * 8;
        birdRef.current.rotation = Math.sin(timestamp / 400) * 10;
        groundOffsetRef.current = (groundOffsetRef.current + 1) % 40;
      } else if (gameStateRef.current === "dead") {
        // Bird falls
        birdRef.current.vy += GRAVITY * dt;
        birdRef.current.y = Math.min(birdRef.current.y + birdRef.current.vy * dt, groundY - BIRD_SIZE / 2);
        birdRef.current.rotation = Math.min(90, birdRef.current.rotation + 5);
      }

      // Draw pipes
      for (const pipe of pipesRef.current) {
        drawPipe(ctx, pipe.x, pipe.topHeight, H);
      }

      // Draw bird
      drawBird(ctx, BIRD_X, birdRef.current.y, birdRef.current.rotation);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [checkCollision]
  );

  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const resize = () => {
      const maxW = Math.min(window.innerWidth, 480);
      const maxH = window.innerHeight;
      canvas.width = maxW;
      canvas.height = maxH;
      initGame();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [initGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleInput);
    window.addEventListener("mousedown", handleInput);
    window.addEventListener("touchstart", handleInput, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleInput);
      window.removeEventListener("mousedown", handleInput);
      window.removeEventListener("touchstart", handleInput);
    };
  }, [handleInput]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  return (
    <div className="relative flex items-center justify-center w-screen h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="block" />

      {/* Score HUD */}
      {gameState === "playing" && (
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center pointer-events-none">
          <div
            className={`text-white text-4xl font-bold tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${scoreAnim ? "animate-scorePopup" : ""}`}
            style={{ textShadow: "0 0 20px rgba(250,204,21,0.6), 2px 2px 0 rgba(0,0,0,0.8)" }}
          >
            {displayScore}
          </div>
        </div>
      )}

      {/* Idle Screen */}
      {gameState === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="text-center px-6">
            <div
              className="text-5xl font-black text-yellow-400 mb-2 tracking-wide"
              style={{ textShadow: "0 0 30px rgba(250,204,21,0.8), 3px 3px 0 rgba(0,0,0,0.8)" }}
            >
              FLAPPY BIRD
            </div>
            <div
              className="text-sm text-yellow-200 mb-10 tracking-widest"
              style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.8)" }}
            >
              NEXT.JS EDITION
            </div>

            {displayBest > 0 && (
              <div className="mb-8 bg-black/40 backdrop-blur rounded-2xl px-8 py-3 border border-yellow-400/30">
                <span className="text-yellow-400 text-sm tracking-wider">BEST: </span>
                <span className="text-white text-2xl font-bold">{displayBest}</span>
              </div>
            )}

            <div
              className="animate-pulse-glow bg-yellow-400/10 border-2 border-yellow-400 rounded-2xl px-10 py-4 backdrop-blur"
            >
              <p className="text-yellow-300 text-base font-bold tracking-wider">
                TAP / SPACE to Play
              </p>
            </div>

            <div className="mt-6 text-white/40 text-xs tracking-wider">
              Press SPACE or tap the screen
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "dead" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="text-center px-6">
            <div
              className="text-5xl font-black text-red-400 mb-2"
              style={{ textShadow: "0 0 30px rgba(239,68,68,0.8), 3px 3px 0 rgba(0,0,0,0.8)" }}
            >
              GAME OVER
            </div>

            <div className="mt-8 mb-8 bg-black/60 backdrop-blur rounded-3xl px-10 py-6 border border-white/10">
              <div className="mb-4">
                <div className="text-white/60 text-xs tracking-widest mb-1">SCORE</div>
                <div
                  className="text-white text-5xl font-black"
                  style={{ textShadow: "0 0 20px rgba(250,204,21,0.5)" }}
                >
                  {displayScore}
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="text-yellow-400/80 text-xs tracking-widest mb-1">BEST</div>
                <div className="text-yellow-400 text-3xl font-bold">{displayBest}</div>
              </div>
            </div>

            <div className="animate-pulse-glow bg-yellow-400/10 border-2 border-yellow-400 rounded-2xl px-10 py-4 backdrop-blur">
              <p className="text-yellow-300 text-base font-bold tracking-wider">
                TAP to Play Again
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint (playing) */}
      {gameState === "playing" && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div className="text-white/20 text-xs tracking-wider">
            SPACE / TAP to flap
          </div>
        </div>
      )}
    </div>
  );
}
