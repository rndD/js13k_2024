import {
  drawRect,
  rgb,
  tile,
  TileInfo,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObjectType, WeaponType } from "../types";
import { GameObject } from "./gameObject";

export interface IWeapon extends GameObject {
  fireRate: number;
  type: WeaponType;
  distance: number;
  fireTimer: Timer;
  canFire: (pos: Vector2) => boolean;
  aimAt: (pos: Vector2) => void;
  fire: () => void;
  target?: GameObject;
}

class Weapon extends GameObject {
  fireTimer = new Timer();
  fireRate!: number;
  distance = 1000;

  constructor(pos: Vector2, size: Vector2, tileInfo?: TileInfo) {
    super(GameObjectType.Weapon, pos, size, tileInfo);
  }

  canFire(pos: Vector2): boolean {
    return this.fireTimer.elapsed() && this.pos.distance(pos) <= this.distance;
  }

  fire() {
    this.fireTimer.set(this.fireRate);
  }

  aimAt(pos: Vector2) {
    this.localAngle = pos.subtract(this.pos).angle();
  }
}

export class Gun extends Weapon implements IWeapon {
  fireRate = 0.1;
  type = WeaponType.Gun;
  distance = 15;
  constructor() {
    super(vec2(0, 0), vec2(0.5, 0.5), tile(5, 8, 1));
    this.fireTimer.set(this.fireRate);
  }

  fire(): void {
    super.fire();
    new Bullet(this.pos, this.angle);
  }
}

class Bullet extends GameObject {
  initialPos: Vector2;
  speed = 0.5;
  lifeTime = 1.5;
  lifeTimer = new Timer(this.lifeTime);
  constructor(pos: Vector2, angle: number) {
    super(GameObjectType.Bullet, pos, vec2(0.2, 0.2));
    this.angle = angle;
    // organge
    this.color = rgb(1, 0.5, 0);
    this.initialPos = pos;
    this.setCollision(true, false, false);
    this.velocity = vec2(0, this.speed).rotate(-angle);
  }

  update() {
    super.update();

    this.color.a = 1 - this.lifeTimer.getPercent();
    if (this.lifeTimer.elapsed()) this.destroy();
  }

  collideWithObject(object: GameObject): boolean {
    if (object.gameObjectType === GameObjectType.Enemy) {
      object.damage(10);
      object.applyForce(this.velocity.scale(0.5));
      this.destroy();
      return false;
    }
    return false;
  }

  render(): void {
    drawRect(
      this.pos,
      this.size.scale(1.3),
      rgb(255, 0, 0, this.color.a - 0.5),
      this.angle
    );
    super.render();
  }
}

export class Sword extends Weapon implements IWeapon {
  type = WeaponType.Sword;
  fireRate = 1;
  distance = 5;
  constructor() {
    super(vec2(0, 0), vec2(0.5, 1), tile(4, 8, 1));
    this.fireTimer.set(this.fireRate);
  }
}
