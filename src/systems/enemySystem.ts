import { Timer, vec2, Vector2 } from "littlejsengine";
import { Enemy } from "../enemy";
import { Character } from "../character";

export class EnemySystem {
  spawnTimer = new Timer();
  level = 1;
  enemies: Enemy[] = [];
  character!: Character;
  map!: number[][];

  deadEnemiesCount: number = 0;

  constructor(character: Character, map: number[][]) {
    this.spawnTimer.set(this.getTimeForTimer());
    this.character = character;
    this.map = map;
  }

  levelUp() {
    if (this.level >= 5) return;
    this.level++;
  }

  getTimeForTimer() {
    return 1 / this.level;
  }

  update() {
    if (this.spawnTimer.elapsed()) {
      this.spawnTimer.set(this.getTimeForTimer());

      // count deda
      const wasLive = this.enemies.length;
      // remove dead enemies
      this.enemies = this.enemies.filter((e) => !e.isDead());
      const isLive = this.enemies.length;
      this.setDeadEnemiesCount(wasLive - isLive);
      for (let i = 0; i < this.level; i++) {
        this.enemies.push(new Enemy(this.calcEnemyPosition(), this.character));
      }
    }
  }
  setDeadEnemiesCount(plus: number) {
    if (plus + this.deadEnemiesCount > this.level * 5) {
      this.levelUp();
    }
    this.deadEnemiesCount += plus;
  }

  calcEnemyPosition(): Vector2 {
    // draw a circle around the character and find a random spot

    const radius = 15;
    while (true) {
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const pos = this.character.pos.add(vec2(x, y));
      const tile = this.map[Math.floor(pos.x)]
        ? this.map[Math.floor(pos.x)][Math.floor(pos.y)]
        : 0;
      if (tile && tile > 0) return pos.add(vec2(0.5));
    }
  }
}
