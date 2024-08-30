import {
  drawRect,
  drawText,
  EngineObject,
  hsl,
  isOverlapping,
  mainCanvas,
  rgb,
  screenToWorld,
  vec2,
  Vector2,
} from "littlejsengine";

class Button extends EngineObject {
  icon: string;
  text: string;
  selected = false;
  constructor(pos: Vector2, icon: string, text: string = "") {
    super(pos, vec2(8, 8));
    this.icon = icon;
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
    super.render();
    drawText(this.icon, this.pos, 1.5, hsl(0, 0, 0));
    drawText(this.text, this.pos.add(vec2(0, -1)), 0.8, hsl(0, 0, 0));
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
    const b = new Button(buttonPos, "🔪", "Sword.js 35 dmg");
    b.selected = true;
    this.buttons.push(b);
    this.addChild(b);
    const buttonPos2 = pos.add(vec2(0, 10));
    const b2 = new Button(buttonPos2, "☠", "Nuke.css \n50dmg \nburn area dmg");
    this.buttons.push(b2);
    this.addChild(b2);
    const buttonPos3 = pos.add(vec2(10, 10));
    const b3 = new Button(
      buttonPos3,
      "☢",
      "Radiation.js 10dmg \n poison are dmg"
    );
    this.buttons.push(b3);
    this.addChild(b3);
  }

  select(n: number) {
    this.selected += n;
    if (this.selected >= this.buttons.length) {
      this.selected = 0;
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
