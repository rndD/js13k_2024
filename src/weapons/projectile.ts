import {
  drawRect,
  rand,
  rgb,
  tile,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { IWeapon, Weapon } from "../base/gameWeapon";
import { GameObject } from "../base/gameObject";
import { GameObjectType, WeaponType } from "../types";
import { Stats } from "../stats";

class Bullet extends GameObject {
  initialPos: Vector2;
  speed = 0.5;
  lifeTime = 1.5;
  lifeTimer = new Timer(this.lifeTime);
  dmg!: number;
  constructor(pos: Vector2, angle: number, dmg: number) {
    super(GameObjectType.Bullet, pos, vec2(0.2, 0.2), undefined, angle);
    // organge
    this.color = rgb(1, 0.5, 0);
    this.initialPos = pos;
    this.setCollision(true, false, false);
    this.velocity = vec2(0, this.speed).rotate(-angle);
    this.dmg = dmg;
  }

  update() {
    super.update();

    this.color.a = 1 - this.lifeTimer.getPercent();
    if (this.lifeTimer.elapsed()) this.destroy();
  }

  collideWithObject(object: GameObject): boolean {
    if (object.gameObjectType === GameObjectType.Enemy) {
      this.destroy();
      object.damage(this.dmg);
      object.applyForce(this.velocity.scale(0.5));
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

export class Gun extends Weapon implements IWeapon {
  type = WeaponType.Gun;
  constructor(stats: Stats) {
    super(vec2(0, 0), vec2(1), tile(4, 8));
    const [, distance, dmg, fireRate] = stats;
    this.dist = distance;
    this.dmg = dmg;
    this.fireRate = fireRate;

    this.fireTimer.set(rand(-0.02, 0.02));
  }
  dis: number;
  donNotAttackFlying?: boolean | undefined;

  fire(): void {
    super.fire();
    new Bullet(this.pos, this.angle, this.dmg);
  }
}
