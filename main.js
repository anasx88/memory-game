import { makeCardFaceTexture } from "./textures.js";

// ------------------------------------------------------------
// Memory game (2D canvas) — runs with plain static files
// Works on GitHub Pages without build/terminal.
// ------------------------------------------------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const btnNew = document.getElementById("btnNew");

const W = canvas.width;
const H = canvas.height;

const GAME = {
  cols: 4,
  rows: 3,
  padding: 18,
  cardW: 160,
  cardH: 200,
  gap: 14,
  flipMs: 320,
};

let cards = [];
let selected = [];
let locked = false;
let matched = 0;

function setStatus(t){ statusEl.textContent = t; }

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newRound(){
  matched = 0;
  selected = [];
  locked = false;

  const pairs = (GAME.cols * GAME.rows) / 2;
  const labels = [];
  for (let i=1; i<=pairs; i++) labels.push(i, i);
  shuffle(labels);

  cards = [];
  let idx = 0;
  const totalW = GAME.cols * GAME.cardW + (GAME.cols-1) * GAME.gap;
  const totalH = GAME.rows * GAME.cardH + (GAME.rows-1) * GAME.gap;
  const startX = Math.round((W - totalW) / 2);
  const startY = Math.round((H - totalH) / 2);

  for (let r=0; r<GAME.rows; r++){
    for (let c=0; c<GAME.cols; c++){
      const x = startX + c * (GAME.cardW + GAME.gap);
      const y = startY + r * (GAME.cardH + GAME.gap);
      const label = labels[idx++];
      cards.push({
        id: cards.length,
        label,
        x, y,
        w: GAME.cardW,
        h: GAME.cardH,
        face: null,
        flipped: false,
        matched: false,
        anim: 1, // 1 = fully face-down, 0 = fully face-up (we'll use scale)
      });
    }
  }

  setStatus("ابدأ: اختر بطاقتين");
  draw();
}

function drawBackground(){
  ctx.clearRect(0,0,W,H);
  // subtle grid
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  for (let x=0; x<W; x+=48){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  for (let y=0; y<H; y+=48){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCard(card){
  const cx = card.x + card.w/2;
  const cy = card.y + card.h/2;

  // flip animation: scaleX from 1 -> 0 -> 1
  const t = card.anim; // 1 = face-down, 0 = face-up
  const scaleX = Math.abs(1 - 2*t); // 1..0..1
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);
  ctx.translate(-cx, -cy);

  const showBack = t > 0.5;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.roundRect(card.x+6, card.y+10, card.w, card.h, 18);
  ctx.fill();

  // body
  if (showBack){
    // back design
    ctx.fillStyle = "rgba(18,26,43,.92)";
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.w, card.h, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "rgba(74,163,255,.35)";
    ctx.lineWidth = 3;
    for (let i=0; i<6; i++){
      ctx.beginPath();
      ctx.arc(card.x+card.w/2, card.y+card.h/2, 22 + i*16, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    if (!card.face){
      card.face = makeCardFaceTexture(ctx, card.label, 220, 300);
    }
    ctx.drawImage(card.face, card.x, card.y, card.w, card.h);
    ctx.strokeStyle = card.matched ? "rgba(80, 255, 170, .55)" : "rgba(255,255,255,.14)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.w, card.h, 18);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHud(){
  ctx.fillStyle = "rgba(230,237,243,.9)";
  ctx.font = "600 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Matched: ${matched}/${(GAME.cols*GAME.rows)/2}`, 12, 20);
}

function draw(){
  drawBackground();
  for (const card of cards){
    drawCard(card);
  }
  drawHud();
}

function cardAt(px, py){
  for (let i=cards.length-1; i>=0; i--){
    const c = cards[i];
    if (px>=c.x && px<=c.x+c.w && py>=c.y && py<=c.y+c.h) return c;
  }
  return null;
}

function flipTo(card, faceUp){
  // animate anim value: faceDown = 1, faceUp = 0
  const start = card.anim;
  const end = faceUp ? 0 : 1;
  const t0 = performance.now();

  function step(now){
    const p = Math.min(1, (now - t0) / GAME.flipMs);
    card.anim = start + (end - start) * p;
    draw();
    if (p < 1) requestAnimationFrame(step);
    else {
      card.flipped = faceUp;
    }
  }
  requestAnimationFrame(step);
}

function handlePick(card){
  if (!card || locked) return;
  if (card.matched) return;
  if (selected.includes(card)) return;
  if (card.flipped) return;

  // flip up
  selected.push(card);
  flipTo(card, true);

  if (selected.length === 2){
    locked = true;
    const [a,b] = selected;
    // wait for animation then check
    setTimeout(() => {
      if (a.label === b.label){
        a.matched = true; b.matched = true;
        matched++;
        setStatus(matched === (GAME.cols*GAME.rows)/2 ? "انتهت الجولة ✅" : "مطابقة ✅ اختر بطاقتين");
        selected = [];
        locked = false;
        draw();
      } else {
        setStatus("غير متطابقة — حاول مرة أخرى");
        // flip back after a beat
        setTimeout(() => {
          flipTo(a, false);
          flipTo(b, false);
          selected = [];
          locked = false;
          draw();
          setStatus("اختر بطاقتين");
        }, 520);
      }
    }, GAME.flipMs + 40);
  } else {
    setStatus("اختر البطاقة الثانية");
  }
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  handlePick(cardAt(x,y));
});

btnNew.addEventListener("click", newRound);
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") newRound();
});

// Canvas roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    this.beginPath();
    this.moveTo(x+rr, y);
    this.arcTo(x+w, y, x+w, y+h, rr);
    this.arcTo(x+w, y+h, x, y+h, rr);
    this.arcTo(x, y+h, x, y, rr);
    this.arcTo(x, y, x+w, y, rr);
    this.closePath();
    return this;
  }
}

newRound();
