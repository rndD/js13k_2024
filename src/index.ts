import {
  engineInit,
  vec2,
  setTileSizeDefault,
  setTileFixBleedScale,
  paused,
  setPaused,
  setFontDefault,
} from "littlejsengine";
import { CharacterMenu } from "./levelUpUI";
import { mainSystem } from "./systems/mainSystem";
import { MainMenu } from "./menuUI";

let characterMenu: CharacterMenu | undefined;
let mainMenu: MainMenu | undefined;

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  setTileSizeDefault(vec2(8));
  setTileFixBleedScale(0.05);
  setFontDefault("monospace");

  // called once after the engine starts up
  // setup the game
  mainMenu = new MainMenu();
  // mainMenu.startGame();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  if (mainMenu?.showMenu) {
    return;
  }

  mainSystem.update();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render

  if (mainMenu?.showMenu) {
    return;
  }
  if (mainSystem.win && !characterMenu) {
    setPaused(true);
    characterMenu = new CharacterMenu(false, true);
  }
  if (mainSystem.gameEnded && !characterMenu) {
    setPaused(true);
    characterMenu = new CharacterMenu(true);
  }
  mainSystem.gameUpdatePost();

  // TODO remove , debug
  // if (keyWasReleased("Enter") && !paused) {
  //   setPaused(!paused);
  // }

  if (paused && !characterMenu) {
    characterMenu = new CharacterMenu();
  }

  if (!paused && characterMenu) {
    characterMenu.destroy();
    characterMenu = undefined;
  }

  if (paused && characterMenu) {
    characterMenu.gameUpdatePost();
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

  if (mainMenu?.showMenu) {
    return;
  }

  mainSystem.gameRenderPost();
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "/1.png",
]);
