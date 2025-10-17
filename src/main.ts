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

let drawing = false;
let px = 0, py = 0;

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  drawing = true;
  px = e.offsetX;
  py = e.offsetY;
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!drawing) return;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  px = e.offsetX;
  py = e.offsetY;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
clearBtn.className = "btn";
document.body.appendChild(clearBtn);

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
