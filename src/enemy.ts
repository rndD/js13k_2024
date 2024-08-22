import { EngineObject, tile, vec2, Vector2 } from "littlejsengine";
import { Character } from "./character";

export class Enemy extends EngineObject {
  character: Character;
  speed = 0.16;
  constructor(pos: Vector2, character: Character) {
    super(pos, vec2(1), tile(0, 8, 1));
    this.setCollision(true, false);
    this.mass = 1;
    this.character = character;
  }

  update() {
    const moveDir = this.character.pos.subtract(this.pos).normalize();
    this.velocity = moveDir.scale(this.speed);
    super.update();
  }
}
