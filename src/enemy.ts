import {
  mod,
  rand,
  rgb,
  Sound,
  tile,
  TileInfo,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObject } from "./base/gameObject";
import { makeDebris } from "./base/gameEffects";
import { mainSystem } from "./systems/mainSystem";
import { XP } from "./xp";
import { GameObjectType } from "./types";

export class Enemy extends GameObject {
  spriteAtlas: TileInfo[] = [tile(7, 8, 1), tile(8, 8, 1)];
  flyingSpriteAtlas: TileInfo[] = [tile(9, 8, 1), tile(10, 8, 1)];
  speed = 0.04;
  health = 10;
  isFlying = false;
  attackTimer = new Timer(1);
  dmg = 5;
  fallingTimer = new Timer();
  walkCyclePercent = 0;
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

  constructor(pos: Vector2) {
    super(GameObjectType.Enemy, pos, vec2(1), tile(7, 8, 1));
    this.isFlying = rand() > 0.8;
    this.size = rand() > 0.5 ? vec2(1, 1) : vec2(1.5, 1.5);
    this.setCollision(true, true, !this.isFlying);
    this.mass = 1;
    this.color = this.isFlying ? rgb(0, 1, 0) : rgb(1, 0, 0);
    this.renderOrder = 1;
  }

  update() {
    super.update();
    if (mainSystem.character.isDead()) {
      return;
    }
    const moveDir = mainSystem.character.pos.subtract(this.pos).normalize();
    this.velocity = moveDir.scale(this.speed);
    const velocityLength = this.velocity.length();

    if (velocityLength > 0) {
      this.walkCyclePercent += velocityLength * 0.5;
      this.walkCyclePercent =
        velocityLength > 0.01 ? mod(this.walkCyclePercent) : 0;
    }

    if (this.velocity.x >= 0) {
      this.mirror = false;
    } else {
      this.mirror = true;
    }

    if (!this.isFlying) {
      if (
        (!mainSystem.map[Math.floor(this.pos.x)] ||
          mainSystem.map[Math.floor(this.pos.x)][Math.floor(this.pos.y)] ===
            0) &&
        !this.fallingTimer.isSet()
      ) {
        this.fallingTimer.set(1);
      }

      if (this.fallingTimer.active()) {
        this.size = vec2(1 - this.fallingTimer.getPercent());
      }
    }

    if (this.fallingTimer.elapsed()) {
      this.destroy();
    }
  }

  collideWithObject(object: GameObject): boolean {
    if (object.gameObjectType === GameObjectType.Character) {
      if (this.attackTimer.elapsed()) {
        object.damage(this.dmg);
        this.attackTimer.set(1);
      }
      return false;
    }
    return true;
  }

  kill() {
    if (this.destroyed) return;

    new XP(this.pos);
    makeDebris(this.pos, this.color, 50, 0.1);
    this.dieSound.play();
    this.destroy();
  }

  damage(damage: number): number {
    const hp = super.damage(damage);
    if (!this.isDead()) {
      //   this.hitSound.stop();
      //   this.hitSound.play();
      makeDebris(this.pos, this.color, 5, 0.1);
    }
    return hp;
  }

  render(): void {
    const animationFrame = Math.floor(this.walkCyclePercent * 2);
    if (this.isFlying) {
      this.tileInfo = this.flyingSpriteAtlas[animationFrame];
    } else {
      this.tileInfo = this.spriteAtlas[animationFrame];
    }
    super.render();
  }
}
