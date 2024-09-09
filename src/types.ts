export const enum GameObjectType {
  Character,
  Enemy,
  Space,
  Wall,
  Bullet,
  Effect,
  AreaDmg,
  EnemyBullet,
  Weapon,
  LevelExit,
}

export const enum WeaponType {
  Gun,
  Spikes,
  Mortar,
  //   Laser,
  Sword,
  Field,
  CrossLaser,
}

export const enum UpgradeType {
  Health,
  Speed,
  Damage,
  AttackSpeed,
  HpRegen,
  Armor,
}

export const enum MemoryType {
  Weapon,
  Upgrade,
}

export const enum MemoryUpgrade {
  Uglify = 2, // 15
  Gzip = 3, // 18
  ClosureCompiler = 4, // 22
  Roadroller = 5, // 27
  XemGolfing = 6, // 33
}

export type Memory = Array<
  | [MemoryType.Weapon, WeaponType, number]
  | [MemoryType.Upgrade, UpgradeType, number]
>;
