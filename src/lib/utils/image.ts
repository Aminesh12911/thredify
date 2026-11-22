const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 600; // downscale so the design fits in browser storage
const EXT = /\.(png|jpe?g)$/i;

/** Validates a PNG/JPG/JPEG upload and returns a downscaled data URL plus aspect ratio. */
export async function processUpload(file: File): Promise<{ dataUrl: string; aspect: number }> {
  if (!EXT.test(file.name) || !["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Please upload a PNG, JPG or JPEG image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is too large. Please choose a file under 5 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file could not be read as an image."));
      i.src = url;
    });
    const k = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process this image.");
    const isPng = file.type === "image/png";
    if (!isPng) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.88), aspect: w / h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
