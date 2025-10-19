import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.appendChild(toolbar);

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
thinBtn.className = "tool-btn selected";
toolbar.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.className = "tool-btn";
toolbar.appendChild(thickBtn);

let currentThickness = 2;

function selectTool(btn: HTMLButtonElement, thickness: number) {
  currentThickness = thickness;
  thinBtn.classList.remove("selected");
  thickBtn.classList.remove("selected");
  btn.classList.add("selected");
}

thinBtn.addEventListener("click", () => selectTool(thinBtn, 2));
thickBtn.addEventListener("click", () => selectTool(thickBtn, 8));

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "stage";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.strokeStyle = "#222";

type Point = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  private points: Point[];
  private thickness: number;

  constructor(start: Point, thickness: number) {
    this.points = [start];
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

const commands: DisplayCommand[] = [];
const redoCommands: DisplayCommand[] = [];

let currentLine: MarkerLine | null = null;
let drawing = false;

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) cmd.display(ctx);

  undoBtn.disabled = commands.length === 0;
  redoBtn.disabled = redoCommands.length === 0;
});

const changed = () => canvas.dispatchEvent(new Event("drawing-changed"));
const pt = (e: MouseEvent): Point => ({ x: e.offsetX, y: e.offsetY });

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  currentLine = new MarkerLine(pt(e), currentThickness);
  commands.push(currentLine);
  redoCommands.length = 0;
  changed();
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!drawing || !currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
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
  commands.length = 0;
  redoCommands.length = 0;
  currentLine = null;
  changed();
});

undoBtn.addEventListener("click", () => {
  if (commands.length === 0) return;
  const popped = commands.pop()!;
  redoCommands.push(popped);
  changed();
});

redoBtn.addEventListener("click", () => {
  if (redoCommands.length === 0) return;
  const popped = redoCommands.pop()!;
  commands.push(popped);
  changed();
});

changed();
