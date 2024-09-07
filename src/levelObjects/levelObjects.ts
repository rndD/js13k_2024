import {
  Color,
  drawText,
  ParticleEmitter,
  tile,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObject } from "../base/gameObject";
import { GameObjectType } from "../types";
import { mainSystem } from "../systems/mainSystem";

export class LevelExit extends GameObject {
  animationTimer = new Timer(0.5);
  constructor(pos: Vector2) {
    super(GameObjectType.LevelExit, pos, vec2(2), tile(59, 8, 0));
    this.setCollision(true);
    this.mass = 0;
    new ParticleEmitter(
      this.pos,
      0, //position, angle
      1, // emitSize
      0, // emitTime
      163, // emitRate
      3.12, // emitConeAngle
      undefined, // tileIndex
      new Color(0, 0.702, 1, 1), // colorStartA
      new Color(0.6, 0, 1, 1), // colorStartB
      new Color(0.459, 0.569, 1, 0), // colorEndA
      new Color(0.863, 0.659, 1, 0), // colorEndB
      0.4, // particleTime
      0.1, // sizeStart
      0.76, // sizeEnd
      0.15, // speed
      0.27, // angleSpeed
      0.11, // damping
      1, // angleDamping
      -0.7, // gravityScale
      3.14, // particleConeAngle
      0.1, // fadeRate
      0.1, // randomness
      0, // collideTiles
      0, // additive
      1 // randomColorLinear
    ); // particle emitter
  }

  render(): void {
    super.render();
    drawText("Level exit", this.pos.subtract(vec2(0, 1.5)), 0.8);
  }
  collideWithObject(object: GameObject): boolean {
    if (object?.gameObjectType === GameObjectType.Character) {
      mainSystem.startNextLevel();
    }
    return false;
  }
}
