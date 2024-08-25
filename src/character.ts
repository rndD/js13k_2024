import {
  clamp,
  drawTile,
  gamepadStick,
  isUsingGamepad,
  keyIsDown,
  mod,
  mousePos,
  rgb,
  tile,
  TileInfo,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { GameObject } from "./base/gameObject";
import { GameObjectType } from "./types";

export class Character extends GameObject {
  spriteAtlas: TileInfo[];
  walkCyclePercent = 0;
  speed = 0.1;
  upgrades: GameObject[] = [];

  constructor(pos: Vector2) {
    super(GameObjectType.Character, pos, vec2(1), tile(0, 8, 1));
    this.spriteAtlas = [tile(0, 8, 1), tile(1, 8, 1), tile(2, 8, 1)];
    this.setCollision(true, false);
    this.size = vec2(1, 0.5);

    this.drawSize = vec2(1.2, 1.2);

    // add gun
    const gun = new Gun();
    this.upgrades.push(gun);
    this.addChild(gun, vec2(-0.5, 0));
    const gun2 = new Gun();
    this.upgrades.push(gun2);
    this.addChild(gun2, vec2(0.5, 0));
  }

  update() {
    // call parent and update physics
    super.update();
    // movement control
    const moveInput = isUsingGamepad
      ? gamepadStick(0)
      : vec2(
          keyIsDown("ArrowRight") - keyIsDown("ArrowLeft"),
          keyIsDown("ArrowUp") - keyIsDown("ArrowDown")
        );

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
    if (moveInput.x) this.mirror = moveInput.x < 0;
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
      this.mirror,
      this.additiveColor
    );
    // super.render();
  }
}

export class Gun extends GameObject {
  fireRate = 0.1;
  fireTimer: Timer;
  constructor() {
    super(GameObjectType.Gun, vec2(0, 0), vec2(0.1, 0.3));
    this.fireTimer = new Timer();
    this.fireTimer.set(this.fireRate);
  }

  update(): void {
    super.update();

    this.angle = mousePos.subtract(this.pos).angle();

    if (this.fireTimer.elapsed()) {
      this.fireTimer.set(this.fireRate);
      new Bullet(this.pos, this.angle);
    }
  }
}

export class Bullet extends GameObject {
  initialPos: Vector2;
  speed = 0.5;
  lifeTime = 1.5;
  lifeTimer: Timer;
  constructor(pos: Vector2, angle: number) {
    super(GameObjectType.Bullet, pos, vec2(0.2, 0.2));
    this.angle = angle;
    // organge
    this.color = rgb(1, 0.5, 0);
    this.initialPos = pos;
    this.setCollision(true, false, false);
    this.velocity = vec2(0, this.speed).rotate(-angle);
    this.lifeTimer = new Timer();
    this.lifeTimer.set(this.lifeTime);
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
}
