import {
  drawRect,
  drawTile,
  isOverlapping,
  lerpAngle,
  ParticleEmitter,
  PI,
  rand,
  randInCircle,
  rgb,
  tile,
  TileInfo,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObjectType, WeaponType } from "../types";
import { GameObject } from "./gameObject";
import { mainSystem } from "../systems/mainSystem";

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
  }
}

export class Gun extends Weapon implements IWeapon {
  fireRate = 0.2;
  type = WeaponType.Gun;
  distance = 10;
  constructor() {
    super(vec2(0, 0), vec2(1), tile(5, 8, 1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
  }

  fire(): void {
    super.fire();
    new Bullet(this.pos, this.angle, 1);
  }
}

class Bullet extends GameObject {
  initialPos: Vector2;
  speed = 0.5;
  lifeTime = 1.5;
  lifeTimer = new Timer(this.lifeTime);
  dmg!: number;
  constructor(pos: Vector2, angle: number, dmg: number) {
    super(GameObjectType.Bullet, pos, vec2(0.2, 0.2));
    this.angle = angle;
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

// TODO: Implement Sword
export class Sword extends Weapon implements IWeapon {
  type = WeaponType.Sword;
  distance = 3.5;
  fireRate = 0.3;

  constructor() {
    super(vec2(0, 0), vec2(1, 1), tile(4, 8, 1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
  }

  fire(): void {
    super.fire();
    new SwordDmgArea(this.pos, vec2(3.5), this.target!.pos, 12);
  }
}

export class SwordDmgArea extends GameObject {
  liveTimer = new Timer(0.15);
  dmg!: number;
  target: Vector2;
  size: Vector2;
  initialPos: Vector2;
  constructor(pos: Vector2, size: Vector2, target: Vector2, dmg: number) {
    const newPos = target.lerp(pos, 0.5);
    super(GameObjectType.AreaDmg, newPos, vec2(size));
    this.dmg = dmg;
    this.target = target.copy();
    this.size = size;
    this.initialPos = pos.copy();

    mainSystem.enemies.forEach((enemy) => {
      if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
        enemy.damage(this.dmg);
      }
    });
  }

  render(): void {
    const t = tile(4, 8, 1);
    const globalPercent = this.liveTimer.getPercent();
    // debug
    // drawRect(this.pos, this.size, rgb(1, 0, 0, 0.5));
    const centerAngle = this.initialPos.subtract(this.pos).angle() + PI;
    const distance = this.initialPos.distance(this.pos);
    for (let i = 1; i < 5; i++) {
      const percent = i / 5;
      if (globalPercent < percent) {
        break;
      }
      const angel = lerpAngle(
        percent,
        centerAngle - PI / 4,
        centerAngle + PI / 4
      );
      const pos = this.initialPos.add(
        this.initialPos.copy().setAngle(angel, distance)
      );
      drawTile(pos, this.size.scale(0.5), t, rgb(1, 1, 1, percent / 3), angel);
    }
  }

  update(): void {
    super.update();
    if (this.liveTimer.elapsed()) {
      this.destroy();
    }
  }
}

export class Mortar extends Weapon implements IWeapon {
  type = WeaponType.Mortar;
  fireRate = 2.5;
  distance = 15;
  minDistance = 2;

  constructor() {
    super(vec2(0, 0), vec2(1), tile(6, 8, 1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
  }

  fire(): void {
    super.fire();
    new MortarShell(this.pos, this.target!.pos);
  }
}

class MortarShell extends GameObject {
  // shell is moving in curve arc
  shellTimer = new Timer(0.7);
  target: Vector2;
  start: Vector2;
  maxY = 8;
  constructor(pos: Vector2, target: Vector2) {
    super(GameObjectType.Effect, pos, vec2(0.3, 0.5));
    // red
    this.color = rgb(1, 0, 0);
    this.target = target.copy();
    this.start = pos.copy();
  }

  update() {
    const percent = this.shellTimer.getPercent();
    this.pos = this.start.lerp(this.target, percent);
    this.pos.y += Math.sin(percent * Math.PI) * this.maxY;
    new ParticleEmitter(
      this.pos,
      0, // pos, angle
      0.1,
      0.1,
      10,
      PI, // emitSize, emitTime, emitRate, emiteCone
      0, // tileInfo
      //black
      rgb(0, 0, 0),
      rgb(0, 0, 0),
      // colorStartA, colorStartB
      rgb(0.5, 0.5, 0.5, 0.8),
      rgb(0.5, 0.5, 0.5, 0.5), // colorEndA, colorEndB
      0.1,
      0.1,
      0.2,
      0.05,
      0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
      0.9,
      1,
      -0.3,
      PI,
      0.1, // damp, angleDamp, gravity, particleCone, fade
      0.5,
      0,
      0,
      0,
      1e8 // randomness, collide, additive, colorLinear, renderOrder
    );
    super.update();
    if (this.shellTimer.elapsed()) {
      this.destroy();
      new AreaDmg(this.pos, vec2(4.5), 10, 1);
    }
  }
}

class AreaDmg extends GameObject {
  liveTimer = new Timer(1);
  dmgTimer = new Timer(0.1);
  dmg: number = 0;
  dmgFire: number = 0;

  dmgedFirst = false;
  constructor(pos: Vector2, size: Vector2, dmg: number, dmgFire: number) {
    super(GameObjectType.AreaDmg, pos, size);
    this.color = rgb(1, 0, 0, 0.03);
    this.dmg = dmg;
    this.dmgFire = dmgFire;
  }

  update() {
    super.update();
    // particle fire 5 random particles
    for (let i = 0; i < 5; i++) {
      new ParticleEmitter(
        this.pos.add(randInCircle(this.size.x / 2)),
        0, // pos, angle
        0.1,
        0.1,
        10,
        PI, // emitSize, emitTime, emitRate, emiteCone
        0, // tileInfo
        //red
        rgb(1, 0, 0),
        rgb(1, 0, 0),
        // colorStartA, colorStartB
        rgb(1, 0.5, 0, 0.8),
        rgb(1, 0.5, 0, 0.5), // colorEndA, colorEndB
        0.1,
        0.1,
        0.2,
        0.05,
        0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
        0.9,
        1,
        -0.3,
        PI,
        0.1, // damp, angleDamp, gravity, particleCone, fade
        0.5,
        0,
        0,
        0,
        1e8 // randomness, collide, additive, colorLinear, render
      );
    }
    if (!this.dmgedFirst) {
      this.dmgedFirst = true;
      // find all enemies in area
      mainSystem.enemies.forEach((enemy) => {
        if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
          enemy.damage(this.dmg);
        }
      });
    }
    if (this.dmgTimer.elapsed()) {
      // find all enemies in area
      mainSystem.enemies.forEach((enemy) => {
        if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
          enemy.damage(this.dmgFire);
        }
      });
      this.dmgTimer.set(0.1);
    }

    if (this.liveTimer.elapsed()) {
      this.destroy();
    }
  }
}
