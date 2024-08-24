import { rgb, Sound, tile, vec2, Vector2 } from "littlejsengine";
import { Character } from "./character";
import { GameObject } from "./base/gameObject";
import { GameObjectType } from "./types";
import { makeDebris } from "./base/gameEffects";

export class Enemy extends GameObject {
  character: Character;
  speed = 0.05;
  dieSound = new Sound([
    ,
    ,
    136,
    0.22,
    ,
    0.08,
    1,
    2.5,
    1,
    ,
    66,
    0.03,
    0.05,
    ,
    ,
    ,
    ,
    0.93,
    ,
    ,
    -1068,
  ]);

  hitSound = new Sound([
    ,
    0.1,
    368,
    0.02,
    0.04,
    0.04,
    2,
    4.3,
    -1,
    ,
    -344,
    0.01,
    ,
    ,
    282,
    ,
    ,
    0.53,
    0.02,
    ,
    130,
  ]);

  constructor(pos: Vector2, character: Character) {
    super(GameObjectType.Enemy, pos, vec2(1), tile(0, 8, 1));
    this.setCollision(true, true);
    this.mass = 1;
    this.character = character;
    this.color = rgb(1, 0, 0);
  }

  update() {
    super.update();
    const moveDir = this.character.pos.subtract(this.pos).normalize();
    this.velocity = moveDir.scale(this.speed);
  }

  collideWithObject(object: GameObject): boolean {
    if (object.gameObjectType === GameObjectType.Character) {
      this.damage(10);
      return false;
    }
    return true;
  }

  kill() {
    if (this.destroyed) return;

    makeDebris(this.pos, this.color, 50, 0.1);
    this.dieSound.play();
    this.destroy();
  }

  damage(damage: number): number {
    const hp = super.damage(damage);
    if (!this.isDead()) {
      this.hitSound.play();
      makeDebris(this.pos, this.color, 5, 0.1);
    }
    return hp;
  }
}
