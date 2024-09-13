import { rgb, tile, Timer, vec2, Vector2 } from "littlejsengine";
import { GameObject } from "./base/gameObject";
import { makeDebris } from "./base/gameEffects";
import { mainSystem } from "./systems/mainSystem";
import { XP } from "./xp";
import { GameObjectType, UpgradeType } from "./types";
import { Sounds, soundSystem } from "./systems/soundSystem";

export class Enemy extends GameObject {
  isFlying = false;
  attackTimer = new Timer(1);
  dmg!: number;
  fallingTimer = new Timer();
  s: number = 0.04;
  l: number = 1;

  constructor(pos: Vector2, level: number, isFlying: boolean) {
    super(GameObjectType.Enemy, pos, vec2(1));
    this.isFlying = isFlying;
    // pink and green
    let color = isFlying ? rgb(1, 0, 1) : rgb(0, 1, 0);
    this.l = level;

    this.size = vec2(1);
    this.dmg = isFlying ? 2 : 5;
    this.hp = isFlying ? 5 : 10;
    this.s = isFlying ? 0.05 : 0.04;
    if (level === 2) {
      this.size = vec2(1.5);
      this.dmg = isFlying ? 5 : 10;
      this.hp = isFlying ? 10 : 20;
      this.s = isFlying ? 0.06 : 0.04;
    }
    if (level === 3) {
      this.size = vec2(2);
      this.dmg = isFlying ? 4 : 9;
      this.hp = isFlying ? 15 : 30;
      this.s = isFlying ? 0.07 : 0.05;
      // orange
      color = rgb(1, 0.5, 0);
    }
    if (level === 4) {
      this.size = vec2(2.5);
      this.dmg = isFlying ? 7 : 15;
      this.hp = isFlying ? 20 : 40;
      this.s = isFlying ? 0.08 : 0.06;
      // gray
      color = rgb(0.5);
    }
    if (level === 5) {
      this.size = vec2(4);
      this.isFlying = true;
      this.dmg = 30;

      this.hp = 500;
      this.s = 0.11;
      // black
      color = rgb(0);
    }

    this.color = color;

    this.setCollision(true, true, !this.isFlying);
    this.mass = 1;
    this.renderOrder = 1;
    if (this.isFlying) {
      this.tileInfo = tile(6);
    } else {
      this.tileInfo = tile(5);
    }
  }

  update() {
    super.update();
    if (mainSystem.character.isDead()) {
      return;
    }
    const moveDir = mainSystem.character.pos.subtract(this.pos).normalize();
    this.velocity = moveDir.scale(this.s);

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
      if (this.attackTimer.elapsed() && !mainSystem.character.isDead()) {
        this.attackTimer.set(1);
        // const armor = mainSystem.character.stats[UpgradeType.Armor];
        object.damage(this.dmg);
      }
      return false;
    }
    return true;
  }

  kill() {
    if (this.destroyed) return;
    let xp = 1;
    if (this.l === 2) {
      xp = 3;
    }
    if (this.l === 3) {
      xp = 6;
    }
    if (this.l === 4) {
      xp = 10;
    }

    new XP(this.pos, xp);
    makeDebris(this.pos, this.color, 50, 0.1);
    soundSystem.play(Sounds.enemyDie);
    this.destroy();
  }

  damage(damage: number): number {
    const hp = super.damage(
      damage * mainSystem.character.stats[UpgradeType.Damage]
    );

    if (!this.isDead()) {
      makeDebris(this.pos, this.color, 5, 0.1);
    }
    soundSystem.play(Sounds.enemyHit);
    return hp;
  }
}
