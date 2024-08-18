import { EngineObject, tile, vec2, Vector2, rand, randInt } from "littlejsengine";

export class Ground extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(1), tile(59, 8));
  }
}

// dungeon generation
const GRID_WIDTH = 150;
const GRID_HEIGHT = 150;

const MIN_ROOM_SIZE = 5;
const MAX_ROOM_SIZE = 20;

const MIN_CORRIDOR_LENGTH = 4;
const MAX_CORRIDOR_LENGTH = 8;

const DEFAULT_ROOMS = 20;

// Dungeon grid (0 = empty, 1 = room, 2 = corridor)
let dungeonGrid: number[][] = Array.from({ length: GRID_HEIGHT }, () =>
  Array(GRID_WIDTH).fill(0)
);

// Room structure
interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createRoom(): Room {
  const width = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  const height = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
  const x = randInt(1, GRID_WIDTH - width - 1);
  const y = randInt(1, GRID_HEIGHT - height - 1);

  return { x, y, width, height };
}


function canPlaceRoom(room: Room): boolean {
  for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
    for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
      if (dungeonGrid[y][x] !== 0) {
        return false;
      }
    }
  }
  return true;
}

function placeRoom(room: Room) {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      dungeonGrid[y][x] = 1; // Mark the room
    }
  }
}

function connectRooms(room1: Room, room2: Room) {
  const startX = randInt(room1.x, room1.x + room1.width - 1);
  const startY = randInt(room1.y, room1.y + room1.height - 1);
  const endX = randInt(room2.x, room2.x + room2.width - 1);
  const endY = randInt(room2.y, room2.y + room2.height - 1);

  // Create a horizontal or vertical path with a corridor width of 3
  if (Math.random() < 0.5) {
    // Horizontal first, then vertical
    createHorizontalCorridor(startX, endX, startY);
    createVerticalCorridor(startY, endY, endX);
  } else {
    // Vertical first, then horizontal
    createVerticalCorridor(startY, endY, startX);
    createHorizontalCorridor(startX, endX, endY);
  }
}

function createHorizontalCorridor(x1: number, x2: number, y: number) {
  const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (let i = -1; i <= w - 1; i++) {
      if (dungeonGrid[y + i] && dungeonGrid[y + i][x] !== 1) {
        dungeonGrid[y + i][x] = 2; // Mark the corridor
      }
    }
  }
}

function createVerticalCorridor(y1: number, y2: number, x: number) {
  const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    for (let i = -1; i <= w - 1; i++) {
      if (dungeonGrid[y][x + i] !== 1) {
        dungeonGrid[y][x + i] = 2; // Mark the corridor
      }
    }
  }
}

export function generateDungeon(roomCount = DEFAULT_ROOMS) {
  const rooms: Room[] = [];

  for (let i = 0; i < roomCount; i++) {
    let newRoom: Room;

    do {
      newRoom = createRoom();
    } while (!canPlaceRoom(newRoom));

    placeRoom(newRoom);

    if (rooms.length > 0) {
      connectRooms(rooms[rooms.length - 1], newRoom);
    }

    rooms.push(newRoom);
  }
  console.log(dungeonGrid.map((row) => row.join("")).join("\n"));

  return dungeonGrid;
}
