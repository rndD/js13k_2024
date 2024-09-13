import {
  cameraPos,
  drawLine,
  drawTextScreen,
  engineObjectsDestroy,
  initTileCollision,
  isTouchDevice,
  rand,
  randInt,
  rgb,
  setCameraPos,
  setCameraScale,
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
import { Sounds, soundSystem } from "./soundSystem";
import { XP } from "../xp";

export const LEVELS_XP = [
  0,
  10,
  25,
  50,
  100,
  150,
  300,
  450,
  700,
  1000,
  1300,
  1700,
  2100,
  2500,
  3000,
  4000,
  5000,
  10000,
  Infinity,
];

export class MainSystem {
  spawnTimer = new Timer();
  chillTime = false;

  enemyLevel!: number;
  enemies!: Enemy[];
  deadEnemiesCount!: number;

  level!: number;
  map!: LevelMap;
  levels!: { map: LevelMap; rooms: Room[]; floorTile?: TileLayer }[];
  rooms!: Room[];
  levelExit?: LevelExit;

  xp!: number;
  character!: Character;
  characterLevel!: number;
  gameEnded = false;

  memory: Memory = [];
  superBoss: Enemy | undefined;
  win = false;

  init() {
    this.levels = [];
    setCameraScale(22);
    for (let i = 0; i < 5; i++) {
      const [map, rooms] = generateDungeon();
      this.levels.push({ map, rooms });
    }

    this.xp = 0;
    this.characterLevel = 0;
    this.enemyLevel = 1;
    this.deadEnemiesCount = 0;
    this.level = 1;
    this.enemies = [];
    this.memory = [
      [
        MemoryType.Weapon,
        [WeaponType.Gun, WeaponType.Sword][Math.random() > 0.5 ? 0 : 1],
        1,
      ],
    ];

    this.startLevel();
    this.gameEnded = false;
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

  rebuildCharacterAfterLevelUP() {
    const pos = this.character.pos.copy();
    this.character.destroy();
    this.character = new Character(pos);
  }

  startNextLevel() {
    this.clearLevel();

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
    } else {
      const pos = vec2(
        this.rooms[this.rooms.length - 1].y + 1,
        this.rooms[this.rooms.length - 1].x + 1
      );
      this.superBoss = new Enemy(pos, 5, true);
      this.enemies.push(this.superBoss);
      this.levelExit = undefined;
    }
    for (let i = 1; i < this.rooms.length - 1; i++) {
      const pos = vec2(this.rooms[i].y + 1, this.rooms[i].x + 1);
      new XP(pos.subtract(vec2(0.5)), (this.level + 1) * 3);
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
    if (this.enemyLevel >= 50) return;
    this.enemyLevel++;
  }

  //character
  getMaxMemory() {
    // console.log(this.memory);
    return this.memory.reduce((acc, mt) => {
      if (mt[0] === MemoryType.MemoryUpgrade) {
        // console.log(mt);
        return acc + mt[1];
      }
      return acc;
    }, 13);
  }

  addXP(xp: number) {
    this.xp += xp;
    if (this.xp >= LEVELS_XP[this.characterLevel + 1]) {
      this.characterLevel++;
      soundSystem.play(Sounds.levelUp);
      setPaused(true);
    }
  }

  isItFloor(pos: Vector2) {
    return this.map[Math.floor(pos.x)]
      ? this.map[Math.floor(pos.x)][Math.floor(pos.y)] > 0
      : false;
  }

  clearLevel() {
    engineObjectsDestroy();
    this.enemies = [];
  }

  update() {
    if (this.character.isDead()) {
      this.clearLevel();
      this.gameEnded = true;
      return;
    }
    if (this.superBoss && this.superBoss.isDead()) {
      this.clearLevel();
      this.win = true;
      return;
    }

    // enemies
    const wasLive = this.enemies.length;
    this.enemies = this.enemies.filter((e) => !e.isDead());
    const isLive = this.enemies.length;
    this.setDeadEnemiesCount(wasLive - isLive);

    // spawn
    if (this.spawnTimer.elapsed()) {
      this.spawnTimer.set(this.getTimeForTimer());

      let maxEnemies = 30;
      if (this.level === 1) {
        maxEnemies = 60;
      }
      if (this.level === 2) {
        maxEnemies = 100;
      }
      if (this.level === 3) {
        maxEnemies = 300;
      }
      if (this.level === 4) {
        maxEnemies = 500;
      }

      for (let i = 0; i < this.enemyLevel + Math.round(maxEnemies / 6); i++) {
        if (this.enemies.length > maxEnemies) {
          this.chillTime = true;
          return;
        }
        const enemyLevelLocal = randInt(0, Math.min(this.level + 1, 4));
        // higher chance for higher level enemies
        const isFlying = rand() <= 0.15;
        this.enemies.push(
          new Enemy(this.calcEnemyPosition(), enemyLevelLocal, isFlying)
        );
      }
    }
  }

  getTimeForTimer() {
    if (this.chillTime) {
      this.chillTime = false;
      return 5;
    }
    return 3 + randInt(0, 2) + this.level;
  }

  setDeadEnemiesCount(plus: number) {
    if (plus + this.deadEnemiesCount > this.enemyLevel * 30) {
      this.enemyLevelUp();
    }
    this.deadEnemiesCount += plus;
  }

  calcEnemyPosition(): Vector2 {
    const radius = 24;
    while (true) {
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const pos = this.character.pos.add(vec2(x, y));

      if (this.isItFloor(pos)) return pos;
    }
  }
  gameUpdatePost() {
    // set camera
    setCameraPos(cameraPos.lerp(this.character.pos, 0.3));
  }

  gameRenderPost() {
    // drawTextScreen(`Live enemies: ${this.enemies.length}`, vec2(95, 20), 16);
    // drawTextScreen(`Dead enemies: ${this.deadEnemiesCount}`, vec2(100, 40), 16);
    // drawTextScreen(`Enemy Level: ${this.enemyLevel}`, vec2(70, 60), 16);
    drawTextScreen(
      `💔: ${this.character.health}/${this.character.maxHealth}`,
      vec2(70, 80),
      16
    );
    drawTextScreen(
      `Data: ${this.xp}/${LEVELS_XP[this.characterLevel + 1]}`,
      vec2(70, 100),
      16
    );

    // arrow to exit
    const currentTarget = this.levelExit || this.superBoss;
    if (currentTarget && currentTarget.pos.distance(this.character.pos) > 20) {
      const angle = currentTarget.pos.subtract(this.character.pos).angle();
      const dist = isTouchDevice ? 9 : 18;
      const posStart = this.character.pos.add(
        this.character.pos.copy().setAngle(angle, dist)
      );
      const posEnd = this.character.pos.add(
        this.character.pos.copy().setAngle(angle, dist + 0.5)
      );
      // console.log(posStart, posEnd, mainSystem.character.pos);
      // white
      drawLine(posStart, posEnd, 0.3, rgb(1, 1, 1, 0.9));
    }
  }
}

export const mainSystem = new MainSystem();
