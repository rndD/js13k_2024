import { TextureInfo } from "littlejsengine";

// eslint-disable-next-line id-denylist
export function strToTextureInfo(str: string, rotate = 0): TextureInfo {
  const canvas = document.createElement("canvas");

  const ctx = canvas.getContext("2d");
  ctx!.imageSmoothingEnabled = false;
  const size = 8;
  canvas.width = size;
  canvas.height = size;
  ctx!.font = `${size}px sans-serif`;
  ctx!.fillStyle = "white";
  ctx!.textAlign = "center";
  ctx!.textBaseline = "middle";
  ctx!.fillText(str, size / 2, size / 2);
  // rotate
  if (rotate) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("no context");
    tempCanvas.width = size;
    tempCanvas.height = size;
    tempCtx.translate(size / 2, size / 2);
    tempCtx.rotate((rotate * Math.PI) / 180);
    tempCtx.drawImage(canvas, -size / 2, -size / 2);
    ctx!.clearRect(0, 0, size, size);
    ctx!.drawImage(tempCanvas, 0, 0);
  }
  const htmlImg = new Image();

  htmlImg.src = canvas.toDataURL();
  //   canvas.remove();

  return new TextureInfo(htmlImg);
}
