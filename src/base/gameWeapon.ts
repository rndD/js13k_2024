import { TileInfo, Timer, Vector2 } from "littlejsengine";
import { GameObject } from "./gameObject";
import { GameObjectType, UpgradeType, WeaponType } from "../types";
import { mainSystem } from "../systems/mainSystem";

export interface IWeapon extends GameObject {
  fireRate: number;
  type: WeaponType;
  dist: number;
  fireTimer: Timer;
  canFire: (pos: Vector2) => boolean;
  aimAt: (pos: Vector2) => void;
  fire: () => void;
  target?: GameObject;
  donNotAttackFlying?: boolean;
  dmg: number;
}

export class Weapon extends GameObject {
  fireTimer = new Timer();
  fireRate!: number;
  dist = 1000;
  minDistance = 0;
  target?: GameObject;
  dmg!: number;

  constructor(pos: Vector2, size: Vector2, tileInfo?: TileInfo) {
    super(GameObjectType.Weapon, pos, size, tileInfo);
  }

  canFire(pos: Vector2): boolean {
    return (
      this.fireTimer.elapsed() &&
      this.pos.distance(pos) <= this.dist &&
      this.pos.distance(pos) >= this.minDistance
    );
  }

  fire() {
    this.fireTimer.set(
      this.fireRate / mainSystem.character.stats[UpgradeType.AttackSpeed]
    );
  }

  aimAt(pos: Vector2) {
    this.localAngle = pos.subtract(this.pos).angle();
    this.mirror = this.localAngle < 0;
  }
}
