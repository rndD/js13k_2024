import { setTileCollisionData, TileLayer, TileLayerData } from "littlejsengine";
import { tile, vec2, randInt } from "littlejsengine";

// dungeon generation
const GRID_WIDTH = 150;
const GRID_HEIGHT = 150;

const MIN_ROOM_SIZE = 5;
const MAX_ROOM_SIZE = 25;

const MIN_CORRIDOR_LENGTH = 4;
const MAX_CORRIDOR_LENGTH = 10;

const DEFAULT_ROOMS = 20;

// Room structure
export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LevelMap = number[][];

function createRoom(): Room {
  const width = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  const height = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  const x = randInt(1, GRID_WIDTH - width - 1);
  const y = randInt(1, GRID_HEIGHT - height - 1);

  return { x, y, width, height };
}

function canPlaceRoom(grid: number[][], room: Room): boolean {
  for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
    for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
      if (grid[y][x] !== 0) {
        return false;
      }
    }
  }
  return true;
}

function placeRoom(grid: number[][], room: Room) {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      grid[y][x] = 1; // Mark the room
    }
  }
}

function connectRooms(grid: number[][], room1: Room, room2: Room) {
  const startX = randInt(room1.x, room1.x + room1.width - 1);
  const startY = randInt(room1.y, room1.y + room1.height - 1);
  const endX = randInt(room2.x, room2.x + room2.width - 1);
  const endY = randInt(room2.y, room2.y + room2.height - 1);

  // Create a horizontal or vertical path with a corridor width of 3
  if (Math.random() < 0.5) {
    // Horizontal first, then vertical
    createHorizontalCorridor(grid, startX, endX, startY);
    createVerticalCorridor(grid, startY, endY, endX);
  } else {
    // Vertical first, then horizontal
    createVerticalCorridor(grid, startY, endY, startX);
    createHorizontalCorridor(grid, startX, endX, endY);
  }
}

function createHorizontalCorridor(
  grid: number[][],
  x1: number,
  x2: number,
  y: number
) {
  const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (let i = -1; i <= w - 1; i++) {
      if (grid[y + i] && grid[y + i][x] !== 1) {
        grid[y + i][x] = 2; // Mark the corridor
      }
    }
  }
}

function createVerticalCorridor(
  grid: number[][],
  y1: number,
  y2: number,
  x: number
) {
  const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    for (let i = -1; i <= w - 1; i++) {
      if (grid[y][x + i] !== 1) {
        grid[y][x + i] = 2; // Mark the corridor
      }
    }
  }
}

export function generateDungeon(roomCount = DEFAULT_ROOMS): [LevelMap, Room[]] {
  const rooms: Room[] = [];
  // Dungeon grid (0 = empty, 1 = room, 2 = corridor)
  let grid: number[][] = Array.from({ length: GRID_HEIGHT }, () =>
    Array(GRID_WIDTH).fill(0)
  );

  for (let i = 0; i < roomCount; i++) {
    let newRoom: Room;

    do {
      newRoom = createRoom();
    } while (!canPlaceRoom(grid, newRoom));

    placeRoom(grid, newRoom);

    if (rooms.length > 0) {
      connectRooms(grid, rooms[rooms.length - 1], newRoom);
    }

    rooms.push(newRoom);
  }
  // debug
  // console.log(grid.map((row) => row.join("")).join("\n"));

  return [grid, rooms];
}

const directions = [
  [0, -1], // left
  [0, 1], // right
  [-1, 0], // up
  [1, 0], // down
  [-1, -1], // up-left
  [1, 1], // down-right
  [-1, 1], // up-right
  [1, -1], // down-left
];
export const hasNeighbor = (map: number[][], x: number, y: number) =>
  directions.some(([dx, dy]) => {
    return map[x + dx] && map[x + dx][y + dy] > 0;
  });

export function generateLevelLayer(
  map: LevelMap,
  rooms: Room[],
  doCollisions = true
) {
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
  return floorTile;
}
