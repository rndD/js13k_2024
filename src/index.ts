import {
  engineInit,
  vec2,
  setCameraScale,
  setTouchGamepadEnable,
  drawTextScreen,
  setTileSizeDefault,
  initTileCollision,
  setTileFixBleedScale,
  paused,
  setPaused,
  keyWasReleased,
  mouseWheel,
  cameraScale,
  mousePos,
} from "littlejsengine";
import { NextLevel, Sky } from "./background";
import { CharacterMenu } from "./ui";
import { mainSystem } from "./systems/mainSystem";

let characterMenu: CharacterMenu;
///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  setTileSizeDefault(vec2(8));
  setTileFixBleedScale(0.05);
  setTouchGamepadEnable(true);

  // called once after the engine starts up
  // setup the game

  setCameraScale(22);
  initTileCollision(vec2(200, 200));

  mainSystem.init();

  new NextLevel();
  new Sky();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  mainSystem.update();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
  mainSystem.gameUpdatePost();
  if (keyWasReleased("Space")) {
    setPaused(!paused);
    if (paused) {
      characterMenu = new CharacterMenu();
    } else {
      characterMenu.destroy();
    }
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
  drawTextScreen(`Enemy Level: ${mainSystem.level}`, vec2(70, 60), 16);
  drawTextScreen(
    `HP: ${mainSystem.character.health}/${mainSystem.character.maxHealth}`,
    vec2(70, 80),
    16
  );
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "/tileset.png", // first
  "/_walk.png", // second
]);
