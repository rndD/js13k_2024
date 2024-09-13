import {
  drawText,
  mod,
  rand,
  rgb,
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
import { GameObjectType, UpgradeType } from "./types";
import { Sounds, soundSystem } from "./systems/soundSystem";

export class Enemy extends GameObject {
  spriteAtlas: TileInfo[] = [tile(7, 8), tile(8, 8)];
  flyingSpriteAtlas: TileInfo[] = [tile(9, 8), tile(10, 8)];

  isFlying = false;
  attackTimer = new Timer(1);
  dmg = 5;
  fallingTimer = new Timer();
  walkCyclePercent = 0;
  speed: number = 0.04;
  level: number = 1;

  constructor(pos: Vector2, level: number, isFlying: boolean) {
    super(GameObjectType.Enemy, pos, vec2(1), tile(7, 8));
    this.isFlying = isFlying;
    // pink and green
    this.color = isFlying ? rgb(1, 0, 1) : rgb(0, 1, 0);
    this.level = level;
    switch (level) {
      case 1: {
        this.size = vec2(1, 1);
        this.dmg = isFlying ? 2 : 5;
        this.hp = isFlying ? 5 : 10;
        this.speed = isFlying ? 0.05 : 0.04;
        break;
      }
      case 2: {
        this.size = vec2(1.5, 1.5);
        this.dmg = isFlying ? 5 : 10;
        this.hp = isFlying ? 10 : 20;
        this.speed = isFlying ? 0.06 : 0.04;
        break;
      }
      case 3: {
        this.size = vec2(2, 2);
        this.dmg = isFlying ? 4 : 9;
        this.hp = isFlying ? 15 : 30;
        this.speed = isFlying ? 0.07 : 0.05;
        // orange
        this.color = rgb(1, 0.5, 0);
        break;
      }
      case 4: {
        this.size = vec2(2.5, 2.5);
        this.dmg = isFlying ? 7 : 15;
        this.hp = isFlying ? 20 : 40;
        this.speed = isFlying ? 0.08 : 0.06;
        // gray
        this.color = rgb(0.5, 0.5, 0.5);
        break;
      }
      case 5: {
        this.size = vec2(4, 4);
        this.isFlying = true;
        this.dmg = 30;

        this.hp = 500;
        this.speed = 0.11;
        // black
        this.color = rgb(0, 0, 0);
        break;
      }
    }

    this.setCollision(true, true, !this.isFlying);
    this.mass = 1;
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
      if (this.attackTimer.elapsed() && !mainSystem.character.isDead()) {
        this.attackTimer.set(1);
        const dodge = mainSystem.character.stats[UpgradeType.Dodge];
        if (rand() <= dodge) {
          new Marker(object.pos);
          return false;
        }
        const armor = mainSystem.character.stats[UpgradeType.Armor];
        object.damage(this.dmg - armor > 0 ? this.dmg - armor : 1);
      }
      return false;
    }
    return true;
  }

  kill() {
    if (this.destroyed) return;
    let xp = 1;
    if (this.level === 2) {
      xp = 3;
    }
    if (this.level === 3) {
      xp = 6;
    }
    if (this.level === 4) {
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

export class Marker extends GameObject {
  lifeTimer = new Timer(0.3);
  text: string;
  constructor(pos: Vector2, text: string = "dodge") {
    super(GameObjectType.Effect, pos, vec2(1), tile(0, 8));
    this.renderOrder = 2;
    this.velocity = vec2(rand(-0.1, 0.1), rand(-0.1, 0.1));
    this.text = text;
  }

  update() {
    super.update();
    if (this.lifeTimer.elapsed()) {
      this.destroy();
    }
  }
  render() {
    drawText(
      this.text,
      this.pos,
      rgb(1, 1, 1, this.lifeTimer.getPercent()),
      0.2
    );
  }
}
