import {
  drawRect,
  drawText,
  EngineObject,
  hsl,
  isOverlapping,
  isTouchDevice,
  keyWasPressed,
  mainCanvas,
  mousePos,
  mouseWasReleased,
  screenToWorld,
  vec2,
} from "littlejsengine";
import { mainSystem } from "./systems/mainSystem";
import { Sky } from "./background";
import { BLACK, PRESS_SPACE, SPACE, WHITE } from "./constants";

export class MainMenu extends EngineObject {
  showMenu = true;
  constructor() {
    const pos = screenToWorld(
      vec2(mainCanvas.width / 2, mainCanvas.height / 2)
    );
    super(pos, vec2(8, 3));
    // white
    this.color = hsl(0, 0, 1);

    new Sky(5);
  }

  render() {
    if (!this.showMenu) return;
    drawRect(
      this.pos.add(vec2(0, -0.5)),
      this.size,
      // white
      WHITE
    );
    drawText(
      `Data warrior`,
      this.pos.add(vec2(0, 4)),
      1.5,
      // white
      WHITE,
      0.2,
      // black
      BLACK
    );
    drawText(
      `13kb limit`,
      this.pos.add(vec2(0, 2.5)),
      1,
      // red
      hsl(0, 1, 0.5),
      0.2,
      // black
      BLACK
    );

    drawText(
      `Start${isTouchDevice ? "" : PRESS_SPACE}`,
      this.pos.add(vec2(0, -0.5)),
      0.6,
      // black
      BLACK
    );
  }

  update(): void {
    if (this.showMenu && keyWasPressed(SPACE)) {
      this.startGame();
    }
    if (mouseWasReleased(0) && isOverlapping(this.pos, this.size, mousePos)) {
      this.startGame();
    }
  }

  startGame() {
    this.showMenu = false;
    this.destroy();
    mainSystem.init();
  }
}
