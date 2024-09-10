import {
  engineObjectsDestroy,
  initTileCollision,
  setPaused,
  TileLayer,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { Enemy } from "../enemy";
import { Character } from "../character";
import { generateDungeon, generateLevelLayer, LevelMap, Room } from "./level";
import { NextLevel, Sky } from "../background";
import { LevelExit } from "../levelObjects/levelObjects";
import { Memory, MemoryType, WeaponType } from "../types";

const MAX_ENEMIES = 500;
export const LEVELS_XP = [
  0,
  1,
  2,
  3,
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
  enemyLevel = 1;
  enemies: Enemy[] = [];
  deadEnemiesCount: number = 0;

  level: number = 0;
  map!: LevelMap;
  levels: { map: LevelMap; rooms: Room[]; floorTile?: TileLayer }[] = [];
  rooms!: Room[];
  levelExit?: LevelExit;

  xp!: number;
  character!: Character;
  characterLevel = 0;

  memory: Memory = [
    [MemoryType.Weapon, WeaponType.Gun, 2],
    [MemoryType.Weapon, WeaponType.CrossLaser, 1],
    [MemoryType.Weapon, WeaponType.Sword, 1],
    [MemoryType.Weapon, WeaponType.Field, 3],
  ];

  init() {
    for (let i = 0; i < 5; i++) {
      const [map, rooms] = generateDungeon();
      this.levels.push({ map, rooms });
    }

    this.xp = 0;

    this.startLevel();
  }

  startLevel() {
    initTileCollision(vec2(250, 250));
    const { map, rooms } = this.levels[this.level];
    this.map = map;
    this.rooms = rooms;

    const floorTile = generateLevelLayer(map, rooms, true);
    floorTile.redraw();
    this.setBackground();

    this.character = new Character(
      vec2(this.rooms[0].y + 1, this.rooms[0].x + 1)
    );

    this.setLevelObjects();

    this.spawnTimer.set(this.getTimeForTimer());
  }

  startNextLevel() {
    engineObjectsDestroy();
    this.enemies = [];

    this.level++;
    this.startLevel();
  }

  setLevelObjects() {
    if (this.levels[this.level + 1]) {
      const pos = vec2(
        this.rooms[this.rooms.length - 1].y + 1,
        this.rooms[this.rooms.length - 1].x + 1
      );
      this.levelExit = new LevelExit(pos);
    }
  }

  setBackground() {
    if (this.levels[this.level + 1]) {
      const { map, rooms } = this.levels[this.level + 1];
      const floorTile = generateLevelLayer(map, rooms, false);
      new NextLevel(floorTile);
    }
    new Sky();
  }

  enemyLevelUp() {
    if (this.enemyLevel >= 5) return;
    this.enemyLevel++;
  }

  addXP(xp: number) {
    this.xp += xp;
    if (this.xp >= LEVELS_XP[this.characterLevel + 1]) {
      this.characterLevel++;
      setPaused(true);
    }
  }

  getTimeForTimer() {
    return 1 / this.enemyLevel;
  }

  isItFloor(pos: Vector2) {
    return this.map[Math.floor(pos.x)]
      ? this.map[Math.floor(pos.x)][Math.floor(pos.y)] > 0
      : false;
  }

  update() {
    const wasLive = this.enemies.length;
    this.enemies = this.enemies.filter((e) => !e.isDead());
    const isLive = this.enemies.length;
    this.setDeadEnemiesCount(wasLive - isLive);

    // spawn
    if (this.spawnTimer.elapsed()) {
      this.spawnTimer.set(this.getTimeForTimer());

      if (this.enemies.length > MAX_ENEMIES) return;
      for (let i = 0; i < this.enemyLevel; i++) {
        this.enemies.push(new Enemy(this.calcEnemyPosition()));
      }
    }
  }

  setDeadEnemiesCount(plus: number) {
    if (plus + this.deadEnemiesCount > this.enemyLevel * 25) {
      this.enemyLevelUp();
    }
    this.deadEnemiesCount += plus;
  }

  calcEnemyPosition(): Vector2 {
    const radius = 20;
    while (true) {
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const pos = this.character.pos.add(vec2(x, y));

      if (this.isItFloor(pos)) return pos;
    }
  }
}

export const mainSystem = new MainSystem();
