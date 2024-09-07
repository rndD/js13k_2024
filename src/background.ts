import {
  cameraPos,
  Color,
  EngineObject,
  hsl,
  mainCanvas,
  mainCanvasSize,
  mainContext,
  randColor,
  randInt,
  RandomGenerator,
  TileLayer,
  time,
  vec2,
} from "littlejsengine";

export class NextLevel extends EngineObject {
  tileLayer: TileLayer;
  color: Color;

  constructor(tileLayer: TileLayer) {
    super();

    // character = new Character(vec2(0));

    this.tileLayer = tileLayer;
    this.renderOrder = -1e4;
    this.color = randColor(hsl(0, 0, 0.5), hsl(0, 0, 0.9));
    this.tileLayer.redraw();
    this.tileLayer.renderOrder = -1e4 - 1;
    this.tileLayer.scale = vec2(0.5);
  }

  render() {
    // create canvas and draw tile layer
    // draw black background
    mainContext.fillStyle = "black";
    mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);
    const scale = this.tileLayer.size;
    let parallax = vec2(1e3, -100).scale(1 ** 2);
    let cameraDeltaFromCenter = cameraPos
      .subtract(scale)
      .divide(scale.divide(parallax));
    const pos = mainCanvasSize
      .scale(0.1) // centerscreen
      .add(cameraDeltaFromCenter.scale(-0.4)); // apply parallax
    //   .add(vec2(-scale.x / 2, -scale.y / 2));
    // mainContext.fillStyle = "red";d
    // mainContext.fillRect(pos.x, pos.y, 300, 300);
    // mainContext.globalCompositeOperation = "lighter";

    mainContext.drawImage(this.tileLayer.canvas, pos.x, pos.y);
  }
}

export class Sky extends EngineObject {
  skyColor: Color;
  horizonColor: Color;
  seed: number;
  constructor() {
    super();

    this.renderOrder = -1e4 + 1;
    this.skyColor = randColor(hsl(0, 0, 0.5, 0.1), hsl(0, 0, 0.1, 0.9));
    this.horizonColor = this.skyColor.subtract(hsl(0, 0, 0.05, 0)).mutate(0.3);
    this.seed = randInt(10);
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

    const random = new RandomGenerator(this.seed);
    for (let i = 15; i--; ) {
      const size = random.float(3, 5) ** 2;
      const speed = random.float() < 0.9 ? random.float(5) : random.float(2, 7);
      const color = hsl(192, 0, 100, 0.8);
      const extraSpace = 50;
      const w = mainCanvas.width + 2 * extraSpace,
        h = mainCanvas.height + 2 * extraSpace;

      const scale = vec2(200);
      let parallax = vec2(1e3, -100).scale(1 ** 2);
      let cameraDeltaFromCenter = cameraPos
        .subtract(scale)
        .divide(scale.divide(parallax));
      const pos = mainCanvasSize
        .scale(0.1) // centerscreen
        .add(cameraDeltaFromCenter.scale(-0.4));

      const screenPos = vec2(
        ((random.float(w) + time * speed) % w) - extraSpace,
        ((random.float(h) + time * speed * random.float()) % h) - extraSpace
      ).add(pos);
      mainContext.shadowColor = "color";
      mainContext.shadowBlur = 3;
      mainContext.fillStyle = color;
      mainContext.fillRect(screenPos.x, screenPos.y, size, size);
    }
    mainContext.restore();
  }
}
