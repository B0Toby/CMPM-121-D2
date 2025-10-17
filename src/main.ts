import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "stage";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.strokeStyle = "#222";

type Point = { x: number; y: number };
const lines: Point[][] = [];
let currentLine: Point[] | null = null;
let drawing = false;

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    if (line.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x, line[i].y);
    }
    ctx.stroke();
  }
});

const changed = () => canvas.dispatchEvent(new Event("drawing-changed"));
const pt = (e: MouseEvent): Point => ({ x: e.offsetX, y: e.offsetY });

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  currentLine = [];
  lines.push(currentLine);
  currentLine.push(pt(e));
  changed();
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!drawing || !currentLine) return;
  currentLine.push(pt(e));
  changed();
});

canvas.addEventListener("mouseup", () => {
  if (!drawing) return;
  drawing = false;
  currentLine = null;
  changed();
});

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
clearBtn.className = "btn";
document.body.appendChild(clearBtn);

clearBtn.addEventListener("click", () => {
  lines.length = 0;
  currentLine = null;
  changed();
});
