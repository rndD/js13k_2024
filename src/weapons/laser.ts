import {
  drawRect,
  isOverlapping,
  rand,
  rgb,
  Timer,
  vec2,
} from "littlejsengine";
import { IWeapon, Weapon } from "../base/gameWeapon";
import { mainSystem } from "../systems/mainSystem";
import { WeaponType } from "../types";
import { Stats } from "../stats";

export class CrossLaser extends Weapon implements IWeapon {
  type = WeaponType.CrossLaser;

  dmg!: number;
  dmgTimer = new Timer(0.01);
  dmgEvery = 0.05;

  liveTimer = new Timer(0.01);
  liveTime!: number;

  lineSize = 0.5;

  constructor(stats: Stats) {
    super(vec2(0), vec2(1));
    this.fireTimer.set(rand(-0.02, 0.02));
    const [, distance, dmg, fireRate, liveTime, , size] = stats;
    this.distance = distance;
    this.dmg = dmg;
    this.fireRate = fireRate;
    this.liveTime = liveTime!;
    this.lineSize = size!;
  }

  fire() {
    super.fire();
    this.liveTimer.set(this.liveTime);
  }

  update() {
    super.update();
    if (this.liveTimer.active() && this.dmgTimer.elapsed()) {
      //dmg ever
      mainSystem.enemies.forEach((enemy) => {
        if (
          // don't know why but radius is smaller than visual radius
          isOverlapping(
            this.pos,
            vec2(this.distance * 2, this.lineSize),
            enemy.pos,
            enemy.size
          ) ||
          isOverlapping(
            this.pos,
            vec2(this.lineSize, this.distance * 2),
            enemy.pos,
            enemy.size
          )
        ) {
          enemy.damage(this.dmg);
        }
      });

      this.dmgTimer.set(this.dmgEvery);
    }
  }

  render(): void {
    if (this.liveTimer.active()) {
      //draw two rectangles from center
      // as a cross
      //   const pos = worldToScreen(this.pos);
      //   const size = this.distance * 2 * 16;
      //   const size2 = this.lineSize * 16;
      //   const canvasPosHorizontal = vec2(pos.x - size / 2, pos.y - size2 / 2);
      //   const canvasPosVertical = vec2(pos.x - size2 / 2, pos.y - size / 2);

      // horizontal
      //   mainContext.fillRect(
      //     canvasPosHorizontal.x,
      //     canvasPosHorizontal.y,
      //     size,
      //     size2
      //   );
      //   const gradient = mainContext.createLinearGradient(
      //     canvasPosVertical.x,
      //     canvasPosVertical.y,
      //     canvasPosVertical.x,
      //     canvasPosVertical.y + size2
      //   );
      //   gradient.addColorStop(0, "rgba(255, 0, 0, 0.4)");
      //   gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.1)");
      //   gradient.addColorStop(1, "rgba(255, 0, 0, 0.4)");

      //   mainContext.fillStyle = gradient;
      //   mainContext.fill();

      //   // vertical
      //   mainContext.fillRect(
      //     canvasPosVertical.x,
      //     canvasPosVertical.y,
      //     size2,
      //     size
      //   );
      //   const gradient2 = mainContext.createLinearGradient(
      //     canvasPosVertical.x,
      //     canvasPosVertical.y,
      //     canvasPosVertical.x + size2,
      //     canvasPosVertical.y
      //   );
      //   gradient2.addColorStop(0, "rgba(255, 0, 0, 0.4)");
      //   gradient2.addColorStop(0.5, "rgba(255, 0, 0, 0.1)");
      //   gradient2.addColorStop(1, "rgba(255, 0, 0, 0.4)");
      //   mainContext.fillStyle = gradient2;
      //   mainContext.fill();
      drawRect(
        this.pos,
        vec2(this.distance * 2, this.lineSize),
        rgb(1, 0, 0, 0.3)
      );
      drawRect(
        this.pos,
        vec2(this.lineSize, this.distance * 2),
        rgb(1, 0, 0, 0.3)
      );
    }
  }
}
