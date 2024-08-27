import {
  EngineObject,
  hsl,
  mainCanvas,
  screenToWorld,
  vec2,
  Vector2,
} from "littlejsengine";

export class CharacterMenu extends EngineObject {
  constructor() {
    const pos = screenToWorld(
      vec2(mainCanvas.width / 2, mainCanvas.height / 2)
    );
    super(pos, vec2(5));
    // this.addChild(new Button(vec2(0, 0), vec2(10), "Play"), vec2(5));
    this.color = hsl(0, 0, 0, 0.3);
  }
}

class Button extends EngineObject {
  text: string;
  constructor(pos: Vector2, size: Vector2, text: string) {
    super(pos, size);
    this.text = text;
    // white
    this.color = hsl(0, 0, 1);
  }
}
