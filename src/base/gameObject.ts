import {
  ASSERT,
  Color,
  EngineObject,
  hsl,
  max,
  percent,
  TileInfo,
  Timer,
  Vector2,
} from "littlejsengine";
import { GameObjectType } from "../types";

export class GameObject extends EngineObject {
  hp: number = 1;
  gameObjectType: GameObjectType;
  damageTimer: Timer;

  constructor(
    t: GameObjectType,
    pos: Vector2,
    size: Vector2,
    tileInfo?: TileInfo,
    angle?: number,
    color?: Color,
    z?: number
  ) {
    super(pos, size, tileInfo, angle, color, z);
    this.gameObjectType = t;

    this.damageTimer = new Timer();
  }

  update() {
    super.update();

    // flash white when damaged
    if (!this.isDead() && this.damageTimer.isSet()) {
      const a = 0.5 * percent(this.damageTimer.get(), 0.15, 0);
      this.additiveColor = hsl(0, 0, a, 0);
    } else this.additiveColor = hsl(0, 0, 0, 0);
  }

  damage(damage: number) {
    ASSERT(damage >= 0);
    if (this.isDead()) return 0;

    // set damage timer
    this.damageTimer.set();
    for (const child of this.children)
      child.damageTimer && child.damageTimer.set();

    // apply damage and kill if necessary
    const newHealth = max(this.hp - damage, 0);
    if (!newHealth) this.kill();

    // set new health and return amount damaged
    return this.hp - (this.hp = newHealth);
  }

  isDead() {
    return !this.hp;
  }

  kill() {
    this.destroy();
  }
}
