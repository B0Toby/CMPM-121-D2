import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.appendChild(toolbar);

const thicknessWrap = document.createElement("label");
thicknessWrap.className = "thickness";
thicknessWrap.textContent = "Thickness: ";

const thicknessInput = document.createElement("input");
thicknessInput.type = "range";
thicknessInput.min = "1";
thicknessInput.max = "24";
thicknessInput.step = "1";
thicknessInput.value = "3";

const thicknessValue = document.createElement("span");
thicknessValue.className = "thickness-value";
thicknessValue.textContent = `${thicknessInput.value}px`;

thicknessWrap.append(thicknessInput, thicknessValue);
toolbar.appendChild(thicknessWrap);

const colorWrap = document.createElement("label");
colorWrap.className = "hue";
colorWrap.textContent = "Color: ";

const hueInput = document.createElement("input");
hueInput.type = "range";
hueInput.min = "0";
hueInput.max = "360";
hueInput.step = "1";
hueInput.value = "210";

const hueSwatch = document.createElement("span");
hueSwatch.className = "hue-swatch";

colorWrap.append(hueInput, hueSwatch);
toolbar.appendChild(colorWrap);

const colorFromHue = (h: number) => `hsl(${h} 85% 45%)`;
const applySwatch =
  () => (hueSwatch.style.background = colorFromHue(Number(hueInput.value)));
applySwatch();

type Tool =
  | { kind: "marker"; thickness: number; color: string }
  | { kind: "sticker"; emoji: string };

let tool: Tool = {
  kind: "marker",
  thickness: Number(thicknessInput.value),
  color: colorFromHue(Number(hueInput.value)),
};

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
  thicknessInput.value = "3";
  thicknessValue.textContent = "3px";
  tool = {
    kind: "marker",
    thickness: 3,
    color: colorFromHue(Number(hueInput.value)),
  };
  markSelected(thinBtn);
};
toolbar.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
thickBtn.className = "tool-btn";
thickBtn.onclick = () => {
  thicknessInput.value = "12";
  thicknessValue.textContent = "12px";
  tool = {
    kind: "marker",
    thickness: 12,
    color: colorFromHue(Number(hueInput.value)),
  };
  markSelected(thickBtn);
};
toolbar.appendChild(thickBtn);

thicknessInput.addEventListener("input", () => {
  const t = Number(thicknessInput.value);
  thicknessValue.textContent = `${t}px`;
  if (tool.kind === "marker") {
    tool = {
      kind: "marker",
      thickness: t,
      color: colorFromHue(Number(hueInput.value)),
    };
    if (preview instanceof MarkerPreview) {
      preview.move(preview.x, preview.y, t, tool.color);
    }
    toolMoved();
  }
});

hueInput.addEventListener("input", () => {
  applySwatch();
  if (tool.kind === "marker") {
    tool = {
      kind: "marker",
      thickness: tool.thickness,
      color: colorFromHue(Number(hueInput.value)),
    };
    if (preview instanceof MarkerPreview) {
      preview.move(preview.x, preview.y, tool.thickness, tool.color);
    }
    toolMoved();
  }
});

const stickerRow = document.createElement("div");
stickerRow.style.display = "flex";
stickerRow.style.gap = "8px";
toolbar.appendChild(stickerRow);

const stickers: string[] = ["🎮", "⭐", "💩"];

function renderStickerButtons() {
  stickerRow.innerHTML = "";

  for (const emoji of stickers) {
    const b = document.createElement("button");
    b.textContent = emoji;
    b.className = "tool-btn";
    b.onclick = () => {
      tool = { kind: "sticker", emoji };
      markSelected(b);
    };
    stickerRow.appendChild(b);
  }

  const addBtn = document.createElement("button");
  addBtn.textContent = "Custom";
  addBtn.className = "tool-btn";
  addBtn.onclick = () => {
    const txt = prompt("Custom sticker text", "🧽");
    if (txt === null) return;
    const value = txt.trim();
    if (value.length === 0) return;
    stickers.push(value);
    renderStickerButtons();
    const lastBtn = stickerRow.querySelectorAll(
      "button",
    )[stickers.length - 1] as HTMLButtonElement;
    tool = { kind: "sticker", emoji: value };
    markSelected(lastBtn);
  };
  stickerRow.appendChild(addBtn);
}
renderStickerButtons();

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "stage";
canvas.style.cursor = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";

type Point = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  private points: Point[] = [];
  constructor(start: Point, private thickness: number, private color: string) {
    this.points.push(start);
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = this.color;
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
  constructor(
    public x: number,
    public y: number,
    public thickness: number,
    public color: string,
  ) {}
  move(x: number, y: number, thickness: number, color: string) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
    this.color = color;
  }
  display(ctx: CanvasRenderingContext2D) {
    const r = this.thickness / 2;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.color;
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
  preview = tool.kind === "marker"
    ? new MarkerPreview(e.offsetX, e.offsetY, tool.thickness, tool.color)
    : new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
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
        ? new MarkerPreview(e.offsetX, e.offsetY, tool.thickness, tool.color)
        : new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
    } else {
      if (preview instanceof MarkerPreview && tool.kind === "marker") {
        preview.move(e.offsetX, e.offsetY, tool.thickness, tool.color);
      } else if (preview instanceof StickerPreview && tool.kind === "sticker") {
        preview.move(e.offsetX, e.offsetY, tool.emoji);
      } else {
        preview = tool.kind === "marker"
          ? new MarkerPreview(e.offsetX, e.offsetY, tool.thickness, tool.color)
          : new StickerPreview(e.offsetX, e.offsetY, tool.emoji);
      }
    }
    toolMoved();
  }
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  if (tool.kind === "marker") {
    currentLine = new MarkerLine(pt(e), tool.thickness, tool.color);
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

const exportBtn = document.createElement("button");
exportBtn.textContent = "Export PNG";
exportBtn.className = "btn";
controls.appendChild(exportBtn);

exportBtn.addEventListener("click", () => {
  const out = document.createElement("canvas");
  out.width = 1024;
  out.height = 1024;
  const outCtx = out.getContext("2d")!;
  outCtx.save();
  outCtx.scale(out.width / canvas.width, out.height / canvas.height);
  for (const cmd of commands) cmd.display(outCtx);
  outCtx.restore();

  const a = document.createElement("a");
  a.href = out.toDataURL("image/png");
  a.download = "sketchpad.png";
  a.click();
});

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
