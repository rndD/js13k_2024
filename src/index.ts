import {
  engineInit,
  vec2,
  setCameraPos,
  setCameraScale,
  setTouchGamepadEnable,
  drawTextScreen,
  TileLayer,
  TileLayerData,
  tile,
  setTileSizeDefault,
  setTileCollisionData,
  initTileCollision,
  setTileFixBleedScale,
  paused,
  setPaused,
  keyWasReleased,
  EngineObject,
  mouseWheel,
  cameraScale,
  mouseWasReleased,
  mousePos,
  cameraPos,
} from "littlejsengine";
import { generateDungeon, hasNeighbor } from "./map";
import { Character } from "./character";
import { MainSystem } from "./systems/mainSystem";
import { NextLevel, Sky } from "./background";
import { CharacterMenu } from "./base/ui";

let character: Character;
let enemySystem: MainSystem;
let characterMenu: EngineObject;

function generateLevel(doCollisions = true) {
  const [map, rooms] = generateDungeon();

  const floorTile = new TileLayer(
    vec2(0),
    vec2(map.length, map[0].length),
    tile(59, 8, 0)
  );

  for (let x = 0; x < map.length; x++) {
    for (let y = 0; y < map[x].length; y++) {
      if (map[x][y] === 0 && doCollisions) {
        if (hasNeighbor(map, x, y)) {
          setTileCollisionData(vec2(x, y), 1);

          continue;
        }
      }
      if (map[x][y] > 0) {
        if (rooms.find((r) => r.x === x && r.y === y)) {
          floorTile.setData(vec2(x, y), new TileLayerData(59));
        } else {
          floorTile.setData(vec2(x, y), new TileLayerData(60));
        }
      }
    }
  }
  return [map, rooms, floorTile] as const;
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  setTileSizeDefault(vec2(8));
  setTileFixBleedScale(0.3);
  setTouchGamepadEnable(true);

  // called once after the engine starts up
  // setup the game

  setCameraScale(22);
  initTileCollision(vec2(200, 200));
  const [map, rooms, floorTile] = generateLevel();
  const [, , _nextLevel] = generateLevel(false);
  const room = rooms[0];
  // character = new Character(vec2(0));
  character = new Character(vec2(room.y + 1, room.x + 1));
  setCameraPos(character.pos);
  enemySystem = new MainSystem(character, map);

  floorTile.redraw();

  new NextLevel(_nextLevel);
  new Sky();
}

let lastMousePos = vec2();
///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  // enemySystem.update();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
  setCameraPos(cameraPos.lerp(character.pos, 0.3));
  if (keyWasReleased("Space")) {
    setPaused(!paused);
    if (paused) {
      characterMenu = new CharacterMenu();
    } else {
      characterMenu.destroy();
    }
  }
  if (mouseWheel) {
    setCameraScale(cameraScale + mouseWheel * 0.2);
  }

  if (mouseWasReleased(0)) {
    lastMousePos = mousePos;

    // console.log(mousePos.add(cameraPos.divide(vec2(1.2))));
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
  drawTextScreen(
    `Live enemies: ${enemySystem.enemies.length}`,
    vec2(95, 20),
    16
  );
  drawTextScreen(
    `Dead enemies: ${enemySystem.deadEnemiesCount}`,
    vec2(100, 40),
    16
  );
  drawTextScreen(`Level: ${enemySystem.level}`, vec2(70, 60), 16);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "/tileset.png", // first
  "/_walk.png", // second
]);
