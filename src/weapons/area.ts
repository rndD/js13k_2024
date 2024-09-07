import {
  drawTile,
  EngineObject,
  isOverlapping,
  lerpAngle,
  mainContext,
  ParticleEmitter,
  PI,
  rand,
  randInCircle,
  rgb,
  tile,
  Timer,
  vec2,
  Vector2,
  worldToScreen,
} from "littlejsengine";
import { IWeapon, Weapon } from "../base/gameWeapon";
import { GameObject } from "../base/gameObject";
import { mainSystem } from "../systems/mainSystem";
import { isAABBInRadius } from "../utils";
import { GameObjectType, WeaponType } from "../types";

export class Sword extends Weapon implements IWeapon {
  type = WeaponType.Sword;
  distance = 3.5;
  fireRate = 0.3;
  area?: SwordDmgArea;

  constructor() {
    super(vec2(0, 0), vec2(1, 1), tile(3, 8, 1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
  }

  fire(): void {
    super.fire();
    this.area = new SwordDmgArea(this.pos, vec2(3.5), this.target!.pos, 12);
  }

  render() {
    if (this.area && this.area.liveTimer.active()) {
      this.color = rgb(1, 1, 1, 0);
    } else {
      this.color = rgb(1, 1, 1);
    }
    super.render();
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
    const t = tile(3, 8, 1);
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
  donNotAttackFlying = true;

  constructor() {
    super(vec2(0, 0), vec2(1), tile(5, 8, 1));
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
      // @ts-ignore
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

export class ForceField extends Weapon implements IWeapon {
  fireRate = 5;
  type = WeaponType.Field;
  distance = 4;

  dmg = 2;

  dmgTimer = new Timer(0.01);
  dmgEvery = 0.2;

  liveTimer = new Timer(0.01);
  liveTime = 2;

  constructor() {
    super(vec2(0, 0), vec2(1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
    //debug
    // this.color = rgb(0, 1, 1, 0.05);
    this.size = vec2(this.distance);
  }

  fire(): void {
    super.fire();
    this.liveTimer.set(this.liveTime);
  }

  update(): void {
    super.update();
    if (this.liveTimer.active() && this.dmgTimer.elapsed()) {
      // find all enemies in area
      mainSystem.enemies.forEach((enemy) => {
        if (
          // don't know why but radius is smaller than visual radius
          isAABBInRadius(this.pos, this.size.x / 2 + 0.5, enemy.pos, enemy.size)
        ) {
          enemy.damage(this.dmg);
        }
      });
      this.dmgTimer.set(this.dmgEvery);
    }
  }

  render(): void {
    // super.render();
    if (this.liveTimer.active()) {
      const percent = this.liveTimer.getPercent();
      // draw a circle
      const pos = worldToScreen(this.pos);
      const size = this.size.x * 16;
      mainContext.beginPath();
      mainContext.arc(pos.x, pos.y, size, 0, 2 * Math.PI, false);
      // gradient from center to edge
      const gradient = mainContext.createRadialGradient(
        pos.x,
        pos.y,
        0,
        pos.x,
        pos.y,
        size
      );
      gradient.addColorStop(0, "rgba(0, 255, 255, 0.4)");
      gradient.addColorStop(1 - percent, "rgba(0, 255, 255, 0.1)");
      gradient.addColorStop(1, "rgba(0, 255, 255, 0.05)");
      mainContext.fillStyle = gradient;
      mainContext.fill();
    }
  }
}

export class Spikes extends Weapon implements IWeapon {
  fireRate = 4;
  type = WeaponType.Spikes;
  distance = 15;
  donNotAttackFlying = true;

  dmg = 5;

  liveTimer = new Timer(0.01);
  liveTime = 0.2;
  step = 1;
  maxStep = 5;
  stepSize = 2.5;
  firePos!: Vector2;

  constructor() {
    super(vec2(0, 0), vec2(1));
    this.fireTimer.set(this.fireRate + rand(-0.02, 0.02));
  }

  fire(): void {
    super.fire();
    this.liveTimer.set(this.liveTime);
    this.firePos = this.pos.copy();
    this.step = 1;
    this.createSpikes();
  }

  update(): void {
    super.update();
    if (this.liveTimer.elapsed() && this.firePos) {
      if (this.step < this.maxStep) {
        this.liveTimer.set(this.liveTime);
        this.createSpikes();
      }
    }
  }
  createSpikes() {
    const pos1 = this.firePos.add(vec2(this.stepSize * this.step, 0));
    const pos2 = this.firePos.add(vec2(-this.stepSize * this.step, 0));
    const pos1isFloor = mainSystem.isItFloor(pos1);
    const pos2isFloor = mainSystem.isItFloor(pos2);
    if (pos1isFloor) {
      new SpikesArea(pos1, vec2(this.stepSize), this.dmg);
    }
    if (pos2isFloor) {
      new SpikesArea(pos2, vec2(this.stepSize), this.dmg);
    }
    if (!pos1isFloor && !pos2isFloor) {
      //skip to next pne
      this.liveTimer.set(0.01);
    }
    this.step++;
  }

  render(): void {}
}

class SpikesArea extends EngineObject {
  dmg: number;
  liveTimer = new Timer(0.8);
  dmgedFirst = false;
  constructor(pos: Vector2, size: Vector2, dmg: number) {
    super(pos, size, tile(6, 8, 1));
    this.color = rgb(1, 0, 0, 0.5);
    this.renderOrder = 0;
    this.dmg = dmg;
  }

  update(): void {
    const percent = this.liveTimer.getPercent();
    super.update();
    if (this.liveTimer.elapsed()) {
      this.destroy();
    }
    if (!this.dmgedFirst && percent > 0.3) {
      this.dmgedFirst = true;
      // find all enemies in area

      mainSystem.enemies.forEach((enemy) => {
        if (
          !enemy.isFlying &&
          isOverlapping(this.pos, this.size, enemy.pos, enemy.size)
        ) {
          enemy.damage(this.dmg);
          enemy.applyForce(vec2(0, 0.5));
        }
      });
    }

    if (percent < 0.5) {
      this.color = rgb(1, 1, 1, percent);
    } else {
      this.color = rgb(1, 1, 1, 1 - percent);
    }
  }
}
