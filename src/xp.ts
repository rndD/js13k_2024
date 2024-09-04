import { EngineObject, rgb, Timer, Vector2 } from "littlejsengine";
import { mainSystem } from "./systems/mainSystem";

export class XP extends EngineObject {
  timer = new Timer(0.1);
  following = false;

  constructor(pos: Vector2) {
    super(pos, new Vector2(0.4, 0.4));
    // Set the color to green
    this.color = rgb(0, 255, 0, 0.5);
    this.renderOrder = 0;
  }
  update(): void {
    super.update();
    // find the distance to player
    const distance = this.pos.subtract(mainSystem.character.pos).length();
    if ((distance < 2.5 || this.following) && this.timer.elapsed()) {
      this.following = true;
      // move to player

      this.velocity = mainSystem.character.pos
        .subtract(this.pos)
        .normalize()
        .scale(0.2);
      this.timer.set(0.1);
    }

    if (distance < 1) {
      // destroy when close to player
      this.destroy();
      // add xp to player
      mainSystem.addXP(1);
    }
  }
}
