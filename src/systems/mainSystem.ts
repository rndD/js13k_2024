import { cameraPos, setCameraPos, Timer, vec2, Vector2 } from "littlejsengine";
import { Enemy } from "../enemy";
import { Character } from "../character";
import { generateLevel, Room } from "./level";

const MAX_ENEMIES = 500;
export const LEVELS_XP = [
  0,
  10,
  25,
  56,
  120,
  200,
  350,
  512,
  1200,
  2000,
  3500,
  5000,
  Infinity,
];

export class MainSystem {
  spawnTimer = new Timer();
  level = 1;
  enemies: Enemy[] = [];
  character!: Character;
  map!: number[][];
  rooms!: Room[];
  xp!: number;
  characterLevel = 0;

  deadEnemiesCount: number = 0;

  init() {
    const [map, rooms, floorTile] = generateLevel();
    floorTile.redraw();
    this.map = map;
    this.rooms = rooms;
    const room = rooms[0];
    this.character = new Character(vec2(room.y + 1, room.x + 1));
    this.spawnTimer.set(this.getTimeForTimer());
    this.xp = 0;
  }

  enemyLevelUp() {
    if (this.level >= 5) return;
    this.level++;
  }
  addXP(xp: number) {
    this.xp += xp;
    if (this.xp >= LEVELS_XP[this.characterLevel + 1]) {
      this.characterLevel++;
    }
  }

  getTimeForTimer() {
    return 1 / this.level;
  }

  update() {
    const wasLive = this.enemies.length;
    this.enemies = this.enemies.filter((e) => !e.isDead());
    const isLive = this.enemies.length;
    this.setDeadEnemiesCount(wasLive - isLive);
    if (this.spawnTimer.elapsed()) {
      this.spawnTimer.set(this.getTimeForTimer());

      // count deda
      // remove dead enemies

      if (this.enemies.length > MAX_ENEMIES) return;
      for (let i = 0; i < this.level; i++) {
        this.enemies.push(new Enemy(this.calcEnemyPosition()));
      }
    }
  }

  gameUpdatePost() {
    setCameraPos(cameraPos.lerp(this.character.pos, 0.3));
  }

  setDeadEnemiesCount(plus: number) {
    if (plus + this.deadEnemiesCount > this.level * 25) {
      this.enemyLevelUp();
    }
    this.deadEnemiesCount += plus;
  }

  calcEnemyPosition(): Vector2 {
    // draw a circle around the character and find a random spot

    const radius = 20;
    while (true) {
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const pos = this.character.pos.add(vec2(x, y));
      const tile = this.map[Math.floor(pos.x)]
        ? this.map[Math.floor(pos.x)][Math.floor(pos.y)]
        : 0;
      if (tile && tile > 0) return pos;
    }
  }
}

export const mainSystem = new MainSystem();
