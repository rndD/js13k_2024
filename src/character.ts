import {
  clamp,
  EngineObject,
  gamepadStick,
  isUsingGamepad,
  keyIsDown,
  mod,
  tile,
  TileInfo,
  vec2,
  Vector2,
} from "littlejsengine";

export class Character extends EngineObject {
  spriteAtlas: TileInfo[];
  walkCyclePercent = 0;
  speed = 0.1;

  constructor(pos: Vector2) {
    super(pos, vec2(1), tile(0, 8, 1));
    this.spriteAtlas = [tile(0, 8, 1), tile(1, 8, 1), tile(2, 8, 1)];
    this.setCollision(true, false);
  }
  update() {
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

    // call parent and update physics
    super.update();
  }

  render(): void {
    // animation
    if (this.speed > 0.02) {
      const animationFrame = Math.floor(this.walkCyclePercent * 2) + 1;
      this.tileInfo = this.spriteAtlas[animationFrame];
    } else {
      this.tileInfo = this.spriteAtlas[0];
    }
    super.render();
  }
}
