import {
  engineInit,
  vec2,
  setCameraPos,
  setCameraScale,
  mouseWheel,
  cameraScale,
  cameraPos,
  mousePos,
  mouseWasReleased,
} from "littlejsengine";
import { generateDungeon, Ground } from "./ground";

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // called once after the engine starts up
  // setup the game
  const map = generateDungeon();

  for (let x = 0; x < map.length; x++) {
    for (let y = 0; y < map[x].length; y++) {
      if (map[x][y] === 0) continue;
      new Ground(vec2(x, y));
    }
  }
  setCameraScale(8);

  // new EngineObject(mainCanvasSize.scale(.5), vec2(100,100),  tile(52, 8), 0, rgb(1,242,0));
}

let lastMousePos = vec2();
///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  if (mouseWheel) {
    setCameraScale(cameraScale + mouseWheel * 0.2);
  }

  if (mouseWasReleased(0)) {
    lastMousePos = mousePos;
   
    // console.log(mousePos.add(cameraPos.divide(vec2(1.2))));
  }
   // slowly move camera to last mouse pos
   if (lastMousePos && cameraPos.distance(lastMousePos) > 0.2) {
    setCameraPos(cameraPos.lerp(lastMousePos, 0.1));
   }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
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
  // drawTextScreen('Hello World!', mainCanvasSize.scale(.5), 80);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "public/tileset.png",
]);
