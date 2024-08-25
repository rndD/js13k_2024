import { EngineObject, vec2, Vector2 } from "littlejsengine";

export class Space extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(1));
    // this.setCollision();
    // this.mass = 0;
  }
  // TODO how to make it invisible?
  //   render(): void {}
}
