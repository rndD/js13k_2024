import {
  drawRect,
  drawText,
  drawTile,
  EngineObject,
  hsl,
  isOverlapping,
  mainCanvas,
  rgb,
  screenToWorld,
  tile,
  TileInfo,
  vec2,
  Vector2,
} from "littlejsengine";

class Button extends EngineObject {
  text: string;
  selected = false;
  constructor(pos: Vector2, icon: TileInfo, text: string = "") {
    super(pos, vec2(8, 8), icon);
    // white
    this.color = hsl(0, 0, 1);
    this.text = text;
  }
  render(): void {
    if (this.selected) {
      drawRect(
        this.pos.add(vec2(-0.3, -0.3)),
        this.size,
        //green
        rgb(0, 1, 0, 0.5)
      );
    }
    drawRect(
      this.pos,
      this.size,
      // white
      rgb(1, 1, 1)
    );
    drawTile(this.pos.add(vec2(0, 1)), this.size.scale(0.5), this.tileInfo);

    drawText(this.text, this.pos.add(vec2(0, -2)), 0.8, hsl(0, 0, 0));
  }
}

export class CharacterMenu extends EngineObject {
  selected = 0;
  buttons: Button[] = [];

  constructor() {
    const pos = screenToWorld(
      vec2(mainCanvas.width / 2, mainCanvas.height / 2)
    );
    super(pos, vec2(40));
    this.color = hsl(0, 0, 0, 0.8);

    const buttonPos = pos.add(vec2(-10, 10));
    const b = new Button(buttonPos, tile(4, 8, 1), "sword.js 40 dmg");
    b.selected = true;
    this.buttons.push(b);
    this.addChild(b);
    const buttonPos2 = pos.add(vec2(0, 10));
    const b2 = new Button(buttonPos2, tile(5, 8, 1), "machineGun.js 3 dmg");
    this.buttons.push(b2);
    this.addChild(b2);
    const buttonPos3 = pos.add(vec2(10, 10));
    const b3 = new Button(
      buttonPos3,
      tile(6, 8, 1),
      "Radiation.js 10dmg \n poison are dmg"
    );
    this.buttons.push(b3);
    this.addChild(b3);

    const c = new CharacterStats(
      pos.subtract(this.size.scale(0.5).add(vec2(-1, -18)))
    );
    this.addChild(c);

    const m = new CharacterMemory(
      pos.subtract(this.size.scale(0.5).add(vec2(-20, -18)))
    );
    this.addChild(m);
  }

  select(n: number) {
    this.selected += n;
    if (this.selected >= this.buttons.length) {
      this.selected = 0;
    } else if (this.selected < 0) {
      this.selected = this.buttons.length - 1;
    }
    this.buttons.forEach((b, i) => (b.selected = i === this.selected));
  }

  mouseSelect(mouse: Vector2) {
    this.buttons.forEach((b, i) => {
      if (isOverlapping(b.pos, b.size, mouse)) {
        this.selected = i;
        this.buttons.forEach((_b) => (_b.selected = false));
        b.selected = true;
      }
    });
  }
}

const stats = {
  health: 100,
  damage: 100,
  speed: 100,
  dodge: 0,
  attackSpeed: 100,
  armor: 0,
  regen: 0,
};

const memory = [
  ["sword.js", 2],
  ["machineGun.js", 1],
  ["Radiation.js", 3],
];

class CharacterStats extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(40));
    this.color = hsl(0, 0, 0, 0.8);
  }

  render() {
    // drawRect(this.pos, this.size, this.color);
    Object.entries(stats).forEach(([key, value], i) => {
      drawText(
        `${key.toUpperCase()}: ${value}%`,
        this.pos.add(vec2(0, i)),
        1,
        hsl(0, 0, 1),
        0.2,
        hsl(0, 0, 100),
        "left"
      );
    });
  }
}

class CharacterMemory extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(40));
    this.color = hsl(0, 0, 0, 0.8);
  }

  render() {
    // drawRect(this.pos, this.size, this.color);
    let p = 0;
    memory.forEach((m, i) => {
      const [name, kb] = m;
      for (let j = 1; j <= kb; j++) {
        p += j;
        drawRect(this.pos.add(vec2(p, 0)), vec2(0.9), hsl(0, 0, 1));
      }
    });
  }
}
