import {
  drawRect,
  drawText,
  EngineObject,
  hsl,
  isOverlapping,
  isTouchDevice,
  keyWasReleased,
  mainCanvas,
  mousePos,
  mouseWasReleased,
  rgb,
  screenToWorld,
  setPaused,
  vec2,
  Vector2,
} from "littlejsengine";
import { MemoryItem, MemoryType, UpgradeType } from "./types";
import { UPGRADES, UPGRADES_WITH_PERCENT, WEAPONS } from "./stats";
import { mainSystem } from "./systems/mainSystem";
import { calcCurrentKb, chooseRandomItem } from "./systems/drop";
import {
  ArrowLeft,
  ArrowRight,
  BLACK,
  PRESS_SPACE,
  SPACE,
  WHITE,
} from "./constants";

class ConfirmButton extends EngineObject {
  selected = false;
  constructor(pos: Vector2) {
    super(pos, vec2(8, 2), undefined, undefined, undefined, 101);
    // white
  }
  render(): void {
    drawRect(
      this.pos,
      this.size,
      // white
      rgb(1)
    );
    drawText(
      `Confirm${isTouchDevice ? "" : PRESS_SPACE}`,
      this.pos.add(vec2(0)),
      0.6,
      BLACK
    );
  }
}

class Button extends EngineObject {
  text: string[];
  selected = false;
  icon: string;
  l: number | undefined;
  kb: number | undefined;
  constructor(
    pos: Vector2,
    icon: string,
    text: string[],
    kb?: number,
    level?: number
  ) {
    super(pos, vec2(8, 5), undefined, undefined, hsl(0, 0, 1), 101);
    // white
    this.text = text;
    this.icon = icon;
    this.l = level;
    this.kb = kb;
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
      WHITE
    );
    drawText(this.icon, this.pos.add(vec2(0, 1.5)), 0.8, BLACK);
    for (let i = 0; i < this.text.length; i++) {
      let text = "* " + this.text[i];
      if (i === 0) {
        text = this.l ? `${this.l}  lvl ${this.text[i]}` : this.text[i];
        drawText(text, this.pos.add(vec2(0, 0.6 + i * -0.6)), 0.6, BLACK);
      } else {
        // dark grey
        drawText(
          text,
          this.pos.add(vec2(0, 0.6 + i * -0.6)),
          0.6,
          hsl(0, 0, 0.3)
        );
      }
    }
    if (this.kb) {
      drawText(`(+${this.kb}kb)`, this.pos.add(vec2(1.5, 1.5)), 0.5, BLACK);
    }
  }
}

export class CharacterMenu extends EngineObject {
  selected = 0;
  buttons: Button[] = [];
  items: MemoryItem[] = [];
  confirmButton: ConfirmButton;
  state: -1 | 0 | 1 = 0;

  constructor(gameOver: boolean = false, win = false) {
    const pos = screenToWorld(
      vec2(mainCanvas.width / 2, mainCanvas.height / 2)
    );
    super(pos, vec2(29, 27), undefined, undefined, BLACK, 100);
    if (gameOver) {
      this.state = -1;
    }
    if (win) {
      this.state = 1;
    }

    this.items = [
      chooseRandomItem(0),
      chooseRandomItem(1),
      chooseRandomItem(2),
    ];

    if (this.state === 0) {
      this.addButton(0, this.items[0]);
      this.addButton(1, this.items[1]);
      this.addButton(2, this.items[2]);
    }

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

  addButton(place: number, mt: MemoryItem) {
    // console.log(mt);
    // if 0 then -10, if 1 then 0, if 2 then 10
    const x = place * 10 - 10;
    const buttonPos = this.pos.add(vec2(x, 2));
    let i = "";
    let d: string[] = [];
    let l: number | undefined;
    let kb: number | undefined;

    if (mt[0] === MemoryType.Weapon) {
      i = WEAPONS[mt[1]].i;
      d = WEAPONS[mt[1]].d;
      l = mt[2];
      kb = WEAPONS[mt[1]][mt[2]][0];
      if (l > 1) {
        kb = WEAPONS[mt[1]][l][0] - WEAPONS[mt[1]][l - 1][0];
      }
    }
    if (mt[0] === MemoryType.Upgrade) {
      i = UPGRADES[mt[1]].i;
      const text = "+" + UPGRADES[mt[1]].s.toString();
      const suffix = UPGRADES_WITH_PERCENT.includes(mt[1]) ? "%" : "";
      kb = 1;
      d = [text + suffix];
    }
    if (mt[0] === MemoryType.MemoryUpgrade) {
      i = "Mem";
      d = [`+${mt[1]}kb`];
    }
    if (mt[0] === MemoryType.XPUpgade) {
      i = "";
      d = [`+${mt[1]}xp`];
    }
    // @ts-ignore
    const b = new Button(buttonPos, i, d, kb, l);
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

  mouseSelect() {
    this.buttons.forEach((b, i) => {
      if (isOverlapping(b.pos, b.size, mousePos)) {
        this.selected = i;
        this.buttons.forEach((_b) => (_b.selected = false));
        b.selected = true;
      }
    });

    if (
      (isOverlapping(
        this.confirmButton.pos,
        this.confirmButton.size,
        mousePos
      ) &&
        mouseWasReleased(0)) ||
      keyWasReleased(SPACE)
    ) {
      if (this.state !== 0) {
        //refresh page
        window.location.reload();
      }
      setPaused(false);
      this.addItem(this.items[this.selected]);
      mainSystem.rebuildCharacterAfterLevelUP();
    }
  }

  addItem(selected: MemoryItem) {
    if (selected[0] === MemoryType.Weapon && selected[2] > 1) {
      // replace last item with the new one
      mainSystem.m = mainSystem.m.map((m) => {
        if (m[0] === MemoryType.Weapon && m[1] === selected[1]) {
          return selected;
        }
        return m;
      });
      return;
    }
    if (selected[0] === MemoryType.XPUpgade) {
      mainSystem.addXP(selected[1]);
      return;
    }
    mainSystem.m.push(selected);
  }

  render() {
    super.render();
    let text = "Lvl up";
    if (this.state === -1) {
      text = "Game over";
    }
    if (this.state === 1) {
      text = "You win";
    }
    drawText(text, this.pos.add(vec2(-10, 6)), 0.9, hsl(0, 0, 1));
  }

  gameUpdatePost() {
    keyWasReleased(ArrowRight) && this.select(1);
    keyWasReleased(ArrowLeft) && this.select(-1);
    this.mouseSelect();
  }
}

export type ISTATS = {
  [UpgradeType.Health]: number;
  [UpgradeType.Damage]: number;
  [UpgradeType.Speed]: number;
  [UpgradeType.AttackSpeed]: number;
  // [UpgradeType.Armor]: number;
  [UpgradeType.HpRegen]: number;
};

class CharacterStats extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(40), undefined, undefined, undefined, 101);
    // console.log(mainSystem.character.stats);
  }

  render() {
    // drawText("Stats:", this.pos.add(vec2(1.5, 0)), 1, hsl(0, 0, 1));
    Object.entries(mainSystem.character.stats).forEach(([key, value], i) => {
      let text = `${UPGRADES[key].i}: ${value}`;
      if (UPGRADES_WITH_PERCENT.includes(Number(key))) {
        value = value * 100;
        value = Math.round(value);
        text = `${UPGRADES[key].i}: ${value}%`;
      }
      if (Number(key) === UpgradeType.Health) {
        text = text + "hp";
      }
      if (Number(key) === UpgradeType.HpRegen) {
        text = text + "hp / 3sec";
      }
      // if (Number(key) === UpgradeType.Armor) {
      //   text = `${UPGRADES[key].i}: -${value} dmg`;
      // }
      drawText(
        text,
        this.pos.add(vec2(0, -i - 1)),
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
  maxMemory: number;
  currentMemory: number;
  constructor(pos: Vector2) {
    super(pos, vec2(40), undefined, undefined, undefined, 101);
    this.maxMemory = mainSystem.getMaxMemory();
    this.currentMemory = calcCurrentKb();
  }

  render() {
    drawText(
      `MEM ${this.currentMemory}kb / ${this.maxMemory}kb`,
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
    mainSystem.m.forEach((m) => {
      const [upgradeType, _type, level] = m;
      if (
        upgradeType !== MemoryType.Weapon &&
        upgradeType !== MemoryType.Upgrade
      )
        return;
      let kb = 1;
      if (upgradeType === MemoryType.Weapon) {
        const [_kb] = WEAPONS[_type][level];
        kb = _kb;
      }

      for (let j = 1; j <= kb; j++) {
        if (p % kbInLine === 0) {
          y--;
          p = 0;
        }
        p++;
        drawRect(this.pos.add(vec2(p, 0 + y)), vec2(1), WEAPONS[_type].c);
      }

      const iconPos = this.pos.add(vec2(p, y - 0.1));
      if (upgradeType === MemoryType.Upgrade) {
        drawText(UPGRADES[_type].i, iconPos, 0.5);
      } else {
        drawText(WEAPONS[_type].i, iconPos, 0.5);
      }
    });

    for (let j = 1; j <= this.maxMemory - this.currentMemory; j++) {
      if (p % kbInLine === 0) {
        y--;
        p = 0;
      }
      p++;
      drawRect(this.pos.add(vec2(p, 0 + y)), vec2(1), hsl(0, 0, 0.5));
      drawRect(this.pos.add(vec2(p, 0 + y)), vec2(0.9), WHITE);
    }
  }
}
