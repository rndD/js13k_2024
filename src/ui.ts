import {
  drawRect,
  drawText,
  EngineObject,
  hsl,
  isOverlapping,
  mainCanvas,
  mouseWasReleased,
  rgb,
  screenToWorld,
  setPaused,
  vec2,
  Vector2,
} from "littlejsengine";
import { MemoryType, WeaponType } from "./types";
import { WEAPONS } from "./stats";
import { mainSystem } from "./systems/mainSystem";

class ConfirmButton extends EngineObject {
  selected = false;
  constructor(pos: Vector2) {
    super(pos, vec2(8, 2));
    // white
    this.color = hsl(0, 0, 1);
    this.renderOrder = 101;
  }
  render(): void {
    drawRect(
      this.pos,
      this.size,
      // white
      rgb(1, 1, 1)
    );
    drawText(
      "Confirm (press space)",
      this.pos.add(vec2(0, 0)),
      0.6,
      hsl(0, 0, 0)
    );
  }
}

class Button extends EngineObject {
  text: string[];
  selected = false;
  icon: string;
  constructor(pos: Vector2, icon: string, text: string[]) {
    super(pos, vec2(8, 5));
    // white
    this.color = hsl(0, 0, 1);
    this.text = text;
    this.renderOrder = 101;
    this.icon = icon;
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
    drawText(this.icon, this.pos.add(vec2(0, 1)), 0.8, hsl(0, 0, 0));
    for (let i = 0; i < this.text.length; i++) {
      drawText(
        `${i > 0 ? "* " : ""}${this.text[i]}`,
        this.pos.add(vec2(0, i * -0.6)),
        0.6,
        hsl(0, 0, 0)
      );
    }
  }
}

export class CharacterMenu extends EngineObject {
  selected = 0;
  buttons: Button[] = [];
  confirmButton: ConfirmButton;

  constructor() {
    const pos = screenToWorld(
      vec2(mainCanvas.width / 2, mainCanvas.height / 2)
    );
    super(pos, vec2(29, 27));
    this.renderOrder = 100;
    this.color = hsl(0, 0, 0, 0.8);

    this.addButton(0, WeaponType.Sword);
    this.addButton(1, WeaponType.Gun);
    this.addButton(2, WeaponType.Spikes);

    this.confirmButton = new ConfirmButton(pos.add(vec2(0, 6)));
    this.addChild(this.confirmButton);

    const c = new CharacterStats(
      pos.subtract(this.size.scale(0.5).add(vec2(-0.5, -11.5)))
    );
    this.addChild(c);

    const m = new CharacterMemory(
      pos.subtract(this.size.scale(0.5).add(vec2(-13, -11.5)))
    );
    this.addChild(m);
  }

  addButton(place: number, w: WeaponType) {
    // if 0 then -10, if 1 then 0, if 2 then 10
    const x = place * 10 - 10;
    const buttonPos = this.pos.add(vec2(x, 2));
    const b = new Button(buttonPos, WEAPONS[w].i, WEAPONS[w].d);
    this.buttons.push(b);
    this.addChild(b);
    if (place === 0) {
      b.selected = true;
    }
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

    if (
      isOverlapping(this.confirmButton.pos, this.confirmButton.size, mouse) &&
      mouseWasReleased(0)
    ) {
      this.addItem();
      setPaused(false);
    }
  }

  addItem() {
    //todo
  }

  render() {
    super.render();
    drawText("Level UP!", this.pos.add(vec2(-10, 6)), 0.9, hsl(0, 0, 1));
    drawText("Select upgrade", this.pos.add(vec2(10, 6)), 0.9, hsl(0, 0, 1));
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

class CharacterStats extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(40));
    this.color = hsl(0, 0, 0, 0.8);
    this.renderOrder = 101;
  }

  render() {
    // drawRect(this.pos, this.size, this.color);
    Object.entries(stats).forEach(([key, value], i) => {
      drawText(
        `${key.toUpperCase()}: ${value}%`,
        this.pos.add(vec2(0, -i)),
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
  currentMemory = 0;
  maxMemory = 13;
  constructor(pos: Vector2) {
    super(pos, vec2(40));
    this.color = hsl(0, 0, 0, 0.8);
    this.renderOrder = 101;

    // calculate current memory
    mainSystem.memory.forEach((m) => {
      if (m[0] === MemoryType.Weapon) {
        this.currentMemory += WEAPONS[m[1]][m[2]][0];
      }
    });
  }

  render() {
    drawText(
      `MEMORY ${this.currentMemory}kb / ${this.maxMemory}kb`,
      this.pos.add(vec2(0.5, 0)),
      1,
      hsl(0, 0, 1),
      0.2,
      hsl(0, 0, 100),
      "left"
    );
    const kbInLine = 10;
    // drawRect(this.pos, this.size, this.color);
    let p = 0;
    let y = 0;
    mainSystem.memory.forEach((m, i) => {
      const [upgradeType, _type, level] = m;
      if (upgradeType !== MemoryType.Weapon) return;
      const [kb] = WEAPONS[_type][level];

      for (let j = 1; j <= kb; j++) {
        if (p % kbInLine === 0) {
          y--;
          p = 0;
        }
        p++;
        drawRect(this.pos.add(vec2(p, 0 + y)), vec2(1), WEAPONS[_type].c);
      }
      const iconPos = this.pos.add(vec2(p, y));
      drawText(WEAPONS[_type].i, iconPos, 0.7);
    });
  }
}
