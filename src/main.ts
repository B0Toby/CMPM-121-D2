import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.appendChild(toolbar);

type Tool =
  | { kind: "marker"; thickness: number }
  | { kind: "sticker"; emoji: string };

let tool: Tool = { kind: "marker", thickness: 2 };

const markSelected = (btn: HTMLButtonElement) => {
  for (const b of toolbar.querySelectorAll("button")) {
    b.classList.remove("selected");
  }
  btn.classList.add("selected");
  toolMoved();
};

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
thinBtn.className = "tool-btn selected";
thinBtn.onclick = () => {
  tool = { kind: "marker", thickness: 2 };
  markSelected(thinBtn);
};
toolbar.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.className = "tool-btn";
thickBtn.onclick = () => {
  tool = { kind: "marker", thickness: 8 };
  markSelected(thickBtn);
};
toolbar.appendChild(thickBtn);

const stickers = ["🎮", "⭐", "💩"];
for (const emoji of stickers) {
  const b = document.createElement("button");
  b.textContent = emoji;
  b.className = "tool-btn";
  b.onclick = () => {
    tool = { kind: "sticker", emoji };
    markSelected(b);
  };
  toolbar.appendChild(b);
}

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "stage";
canvas.style.cursor = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";
ctx.strokeStyle = "#222";

type Point = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  private points: Point[] = [];
  constructor(start: Point, private thickness: number) {
    this.points.push(start);
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

class Sticker implements DisplayCommand {
  constructor(public x: number, public y: number, public emoji: string) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "28px system-ui, emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

class MarkerPreview implements DisplayCommand {
  constructor(public x: number, public y: number, public thickness: number) {}
  move(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }
  display(ctx: CanvasRenderingContext2D) {
    const r = this.thickness / 2;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class StickerPreview implements DisplayCommand {
  constructor(public x: number, public y: number, public emoji: string) {}
  move(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = "28px system-ui, emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

const commands: DisplayCommand[] = [];
const redoCommands: DisplayCommand[] = [];
let currentLine: MarkerLine | null = null;
let currentSticker: Sticker | null = null;
let preview: DisplayCommand | null = null;
let drawing = false;

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) cmd.display(ctx);
  if (!drawing && preview) preview.display(ctx);

  undoBtn.disabled = commands.length === 0;
  redoBtn.disabled = redoCommands.length === 0;
}

const changed = () => canvas.dispatchEvent(new Event("drawing-changed"));
const toolMoved = () => canvas.dispatchEvent(new Event("tool-moved"));
const pt = (e: MouseEvent): Point => ({ x: e.offsetX, y: e.offsetY });

canvas.addEventListener("mouseenter", (e) => {
  if (tool.kind === "marker") {
    preview = new MarkerPreview(e.offsetX, e.offsetY, tool.thickness);
  } else {
    preview = new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
  }
  toolMoved();
});

canvas.addEventListener("mouseleave", () => {
  preview = null;
  toolMoved();
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (drawing) {
    if (currentLine) {
      currentLine.drag(e.offsetX, e.offsetY);
      changed();
    } else if (currentSticker) {
      currentSticker.drag(e.offsetX, e.offsetY);
      changed();
    }
  } else {
    if (!preview) {
      preview = tool.kind === "marker"
        ? new MarkerPreview(e.offsetX, e.offsetY, tool.thickness)
        : new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
    } else {
      if (preview instanceof MarkerPreview && tool.kind === "marker") {
        preview.move(e.offsetX, e.offsetY, tool.thickness);
      } else if (preview instanceof StickerPreview && tool.kind === "sticker") {
        preview.move(e.offsetX, e.offsetY, tool.emoji);
      } else {
        preview = tool.kind === "marker"
          ? new MarkerPreview(e.offsetX, e.offsetY, tool.thickness)
          : new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
      }
    }
    toolMoved();
  }
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  if (tool.kind === "marker") {
    currentLine = new MarkerLine(pt(e), tool.thickness);
    commands.push(currentLine);
  } else {
    currentSticker = new Sticker(e.offsetX, e.offsetY, tool.emoji);
    commands.push(currentSticker);
  }
  redoCommands.length = 0;
  toolMoved();
  changed();
});

canvas.addEventListener("mouseup", () => {
  if (!drawing) return;
  drawing = false;
  currentLine = null;
  currentSticker = null;
  toolMoved();
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
  currentSticker = null;
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

redraw();
