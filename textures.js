// Placeholder textures module.
// You said there is no Atlas; so we draw everything procedurally on canvas.
// If you later add assets, you can export helper loaders from here.

export function makeCardFaceTexture(ctx2d, label, w=220, h=300){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");

  // background
  const grad = g.createLinearGradient(0,0,w,h);
  grad.addColorStop(0, "rgba(74,163,255,.30)");
  grad.addColorStop(1, "rgba(255,180,74,.18)");
  g.fillStyle = grad;
  g.fillRect(0,0,w,h);

  // border
  g.strokeStyle = "rgba(255,255,255,.18)";
  g.lineWidth = 10;
  g.strokeRect(14,14,w-28,h-28);

  // label
  g.fillStyle = "rgba(255,255,255,.92)";
  g.font = "700 72px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(label), w/2, h/2);

  return c;
}
