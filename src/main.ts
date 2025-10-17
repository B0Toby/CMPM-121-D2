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
const redoLines: Point[][] = [];

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

  undoBtn.disabled = lines.length === 0;
  redoBtn.disabled = redoLines.length === 0;
});

const changed = () => canvas.dispatchEvent(new Event("drawing-changed"));
const pt = (e: MouseEvent): Point => ({ x: e.offsetX, y: e.offsetY });

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  currentLine = [];
  lines.push(currentLine);

  redoLines.length = 0;
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

const controls = document.createElement("div");
controls.style.display = "flex";
controls.style.gap = "8px";
document.body.appendChild(controls);

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
clearBtn.className = "btn";
controls.appendChild(clearBtn);

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
undoBtn.className = "btn";
controls.appendChild(undoBtn);

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
redoBtn.className = "btn";
controls.appendChild(redoBtn);

clearBtn.addEventListener("click", () => {
  lines.length = 0;
  redoLines.length = 0;
  currentLine = null;
  changed();
});

undoBtn.addEventListener("click", () => {
  if (lines.length === 0) return;
  const popped = lines.pop()!;
  redoLines.push(popped);
  changed();
});

redoBtn.addEventListener("click", () => {
  if (redoLines.length === 0) return;
  const popped = redoLines.pop()!;
  lines.push(popped);
  changed();
});

changed();
