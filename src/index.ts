import {
  engineInit,
  vec2,
  setCameraScale,
  setTouchGamepadEnable,
  drawTextScreen,
  setTileSizeDefault,
  setTileFixBleedScale,
  paused,
  setPaused,
  keyWasReleased,
  mouseWheel,
  cameraScale,
  mousePos,
  setCameraPos,
  cameraPos,
  drawLine,
  rgb,
} from "littlejsengine";
import { CharacterMenu } from "./ui";
import { LEVELS_XP, mainSystem } from "./systems/mainSystem";

let characterMenu: CharacterMenu;
///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  setTileSizeDefault(vec2(8));
  setTileFixBleedScale(0.05);
  setTouchGamepadEnable(true);

  // called once after the engine starts up
  // setup the game

  setCameraScale(22);

  mainSystem.init();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  mainSystem.update();
  // if (mainSystem.character.isDead() && !paused) {
  //   setPaused(true);
  // }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
  // set camera
  setCameraPos(cameraPos.lerp(mainSystem.character.pos, 0.3));

  if (keyWasReleased("Space")) {
    setPaused(!paused);
  }
  if (paused) {
    characterMenu = new CharacterMenu();
  } else {
    characterMenu && characterMenu.destroy();
  }

  // todo remove
  if (mouseWheel) {
    setCameraScale(cameraScale + mouseWheel * 0.2);
  }

  if (paused) {
    keyWasReleased("ArrowRight") && characterMenu.select(1);
    keyWasReleased("ArrowLeft") && characterMenu.select(-1);
    mousePos && characterMenu.mouseSelect(mousePos);
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  // todo hud
  drawTextScreen(
    `Live enemies: ${mainSystem.enemies.length}`,
    vec2(95, 20),
    16
  );
  drawTextScreen(
    `Dead enemies: ${mainSystem.deadEnemiesCount}`,
    vec2(100, 40),
    16
  );
  drawTextScreen(`Enemy Level: ${mainSystem.enemyLevel}`, vec2(70, 60), 16);
  drawTextScreen(
    `HP: ${mainSystem.character.health}/${mainSystem.character.maxHealth}`,
    vec2(70, 80),
    16
  );
  drawTextScreen(
    `XP: ${mainSystem.xp}/${LEVELS_XP[mainSystem.characterLevel + 1]}`,
    vec2(70, 100),
    16
  );

  // arrow to exit
  if (
    mainSystem.levelExit &&
    mainSystem.levelExit.pos.distance(mainSystem.character.pos) > 20
  ) {
    const angle = mainSystem.levelExit.pos
      .subtract(mainSystem.character.pos)
      .angle();
    const posStart = mainSystem.character.pos.add(
      mainSystem.character.pos.copy().setAngle(angle, 18)
    );
    const posEnd = mainSystem.character.pos.add(
      mainSystem.character.pos.copy().setAngle(angle, 18.5)
    );
    // console.log(posStart, posEnd, mainSystem.character.pos);

    drawLine(posStart, posEnd, 0.3, rgb(1, 0, 0, 0.5));
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "/tileset.png", // first
  "/_walk.png", // second
]);
