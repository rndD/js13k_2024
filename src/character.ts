import {
  clamp,
  drawTile,
  gamepadStick,
  isUsingGamepad,
  keyIsDown,
  mod,
  mouseIsDown,
  mousePos,
  tile,
  TileInfo,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObject } from "./base/gameObject";
import { mainSystem } from "./systems/mainSystem";
import { IWeapon } from "./base/gameWeapon";
import { GameObjectType, MemoryType, WeaponType } from "./types";
import { WEAPONS } from "./stats";

const WEAPONS_POSITIONS = [
  vec2(-0.7, 0), // left
  vec2(0.7, 0), // right
  vec2(-0.7, 0.5), // left-top2
  vec2(0.7, 0.5), // right-top2
  vec2(0, 1), // top
  vec2(0, -0.5), // bottom
  vec2(0, 0), // center
];

export class Character extends GameObject {
  spriteAtlas: TileInfo[] = [tile(0, 8, 1), tile(1, 8, 1), tile(2, 8, 1)];
  walkCyclePercent = 0;
  speed = 0.1;
  maxHealth = 100;

  direction: -1 | 1 = 1;
  weapons: { [key: string]: IWeapon[] } = {};
  // upgrades: IWeapon[] = [];

  constructor(pos: Vector2) {
    super(GameObjectType.Character, pos, vec2(1), tile(1, 8, 1));
    this.setCollision(true, false);
    this.size = vec2(1, 0.5);

    this.drawSize = vec2(2, 2);

    this.health = this.maxHealth;

    // add weapons
    this.buildWeaponsSlots();
    // this.addWeapon(new Sword());
    // this.addWeapon(new Sword());
    // this.addWeapon(new CrossLaser());
    // this.addWeapon(new Mortar());
    mainSystem.memory.forEach((m) => {
      if (m[0] === MemoryType.Weapon) {
        const w = WEAPONS[m[1]].w;
        const stats = WEAPONS[m[1]][m[2]];
        this.addWeapon(new w(stats));
      }
    });
    // this.addWeapon(new ForceField());
  }

  buildWeaponsSlots() {
    for (let i = 0; i < WEAPONS_POSITIONS.length; i++) {
      this.weapons[WEAPONS_POSITIONS[i].toString()] = [];
    }
  }

  addWeapon(w: IWeapon) {
    if (
      w.type === WeaponType.Field ||
      w.type === WeaponType.CrossLaser ||
      w.type === WeaponType.Spikes
    ) {
      const center = WEAPONS_POSITIONS[WEAPONS_POSITIONS.length - 1];
      this.weapons[center.toString()].push(w);
      this.addChild(w, center);
      return;
    }
    let added = false;
    let turns = 0;
    while (!added) {
      for (let i = 0; i < WEAPONS_POSITIONS.length; i++) {
        const pos = WEAPONS_POSITIONS[i];
        if (this.weapons[pos.toString()].length <= turns) {
          this.weapons[pos.toString()].push(w);
          this.addChild(w, pos);
          added = true;
          break;
        }
      }
      turns++;
    }
  }

  update() {
    // call parent and update physics
    super.update();
    // movement control
    let moveInput = isUsingGamepad
      ? gamepadStick(0)
      : vec2(
          // @ts-ignore
          keyIsDown("ArrowRight") - keyIsDown("ArrowLeft"),
          // @ts-ignore
          keyIsDown("ArrowUp") - keyIsDown("ArrowDown")
        );

    if (mouseIsDown(0)) {
      moveInput = mousePos.subtract(this.pos);
    }
    if (moveInput.length() > 0) {
      moveInput = moveInput.normalize(1);
    }

    // apply movement acceleration and clamp
    const maxCharacterSpeed = 0.2;
    this.velocity.x = clamp(
      moveInput.x * 0.42,
      -maxCharacterSpeed,
      maxCharacterSpeed
    );
    this.velocity.y = clamp(
      moveInput.y * 0.42,
      -maxCharacterSpeed,
      maxCharacterSpeed
    );
    this.speed = this.velocity.length();
    if (this.speed > 0) {
      this.walkCyclePercent += this.speed * 0.5;
      this.walkCyclePercent =
        this.speed > 0.01 ? mod(this.walkCyclePercent) : 0;
    }
    // mirror sprite if moving left
    if (moveInput.x) {
      this.direction = moveInput.x > 0 ? 1 : -1;
    }

    // weapons
    this.updateWeapons();
  }

  updateWeapons() {
    mainSystem.enemies.forEach((e) => {
      Object.keys(this.weapons).forEach((vecKey) => {
        const ws = this.weapons[vecKey];
        ws.forEach((w) => {
          if (w.target?.isDead()) {
            w.target = undefined;
          }

          if (w.canFire(e.pos)) {
            // if new target is closer
            const newDistance = w.pos.distance(e.pos);
            const oldDistance = w.target
              ? w.pos.distance(w.target.pos)
              : Infinity;
            const canBeAttackedAsFlying = !w.donNotAttackFlying || !e.isFlying;
            if (
              (!w.target || newDistance < oldDistance) &&
              canBeAttackedAsFlying
            ) {
              w.target = e;
            }
          }
        });
      });
    });

    Object.keys(this.weapons).forEach((vecKey) => {
      const ws = this.weapons[vecKey];
      ws.forEach((w) => {
        if (w.target) {
          w.aimAt(w.target.pos);
          w.canFire(w.target.pos) && w.fire();
        }
      });
    });
  }

  render(): void {
    // animation
    if (this.speed > 0.02) {
      const animationFrame = Math.floor(this.walkCyclePercent * 2) + 1;
      this.tileInfo = this.spriteAtlas[animationFrame];
    } else {
      this.tileInfo = this.spriteAtlas[0];
    }
    drawTile(
      this.pos.subtract(vec2(0, -0.4)),
      this.drawSize || this.size,
      this.tileInfo,
      this.color,
      this.angle,
      this.direction < 0,
      this.additiveColor
    );
    // super.render();
  }
}
