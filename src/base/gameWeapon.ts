import { TileInfo, Timer, Vector2 } from "littlejsengine";
import { GameObject } from "./gameObject";
import { GameObjectType, WeaponType } from "../types";

export interface IWeapon extends GameObject {
  fireRate: number;
  type: WeaponType;
  distance: number;
  fireTimer: Timer;
  canFire: (pos: Vector2) => boolean;
  aimAt: (pos: Vector2) => void;
  fire: () => void;
  target?: GameObject;
  donNotAttackFlying?: boolean;
}

export class Weapon extends GameObject {
  fireTimer = new Timer();
  fireRate!: number;
  distance = 1000;
  minDistance = 0;
  target?: GameObject;

  constructor(pos: Vector2, size: Vector2, tileInfo?: TileInfo) {
    super(GameObjectType.Weapon, pos, size, tileInfo);
  }

  canFire(pos: Vector2): boolean {
    return (
      this.fireTimer.elapsed() &&
      this.pos.distance(pos) <= this.distance &&
      this.pos.distance(pos) >= this.minDistance
    );
  }

  fire() {
    this.fireTimer.set(this.fireRate);
  }

  aimAt(pos: Vector2) {
    this.localAngle = pos.subtract(this.pos).angle();
    this.mirror = this.localAngle < 0;
  }
}
