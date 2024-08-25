import {
  cameraPos,
  Color,
  EngineObject,
  hsl,
  mainCanvas,
  mainCanvasSize,
  mainContext,
  randColor,
  TileLayer,
  vec2,
} from "littlejsengine";

export class NextLevel extends EngineObject {
  tileLayer: TileLayer;
  color: Color;

  constructor(nextLevel: TileLayer) {
    super();
    this.tileLayer = nextLevel;
    this.renderOrder = -1e4;
    this.color = randColor(hsl(0, 0, 0.5), hsl(0, 0, 0.9));
    this.tileLayer.renderOrder = -1e4 - 1;
    this.tileLayer.scale = vec2(0.5);
    this.tileLayer.redraw();
  }

  render() {
    // create canvas and draw tile layer
    // draw black background
    mainContext.fillStyle = "black";
    mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);
    const scale = this.tileLayer.size;
    const parallax = vec2(1e3, -100).scale(1 ** 2);
    const cameraDeltaFromCenter = cameraPos
      .subtract(scale)
      .divide(scale.divide(parallax));
    const pos = mainCanvasSize
      .scale(0.1) // centerscreen
      .add(cameraDeltaFromCenter.scale(-0.4)); // apply parallax
    //   .add(vec2(-scale.x / 2, -scale.y / 2));
    // mainContext.fillStyle = "red";d
    // mainContext.fillRect(pos.x, pos.y, 300, 300);
    mainContext.drawImage(this.tileLayer.canvas, pos.x, pos.y);
  }
}

export class Sky extends EngineObject {
  skyColor: Color;
  horizonColor: Color;
  constructor() {
    super();

    this.renderOrder = -1e4 + 1;
    this.skyColor = randColor(hsl(0, 0, 0.5, 0.1), hsl(0, 0, 0.1));
    this.horizonColor = this.skyColor.subtract(hsl(0, 0, 0.05, 0)).mutate(0.3);
  }

  render() {
    // fill background with a gradient
    const gradient = mainContext.createLinearGradient(
      0,
      0,
      0,
      mainCanvas.height
    );
    gradient.addColorStop(0, this.skyColor);
    gradient.addColorStop(1, this.horizonColor);
    mainContext.save();
    mainContext.fillStyle = gradient;
    mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    mainContext.globalCompositeOperation = "lighter";

    mainContext.restore();
  }
}
