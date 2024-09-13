export const enum GameObjectType {
  Character,
  Enemy,
  Space,
  Wall,
  Bullet,
  Effect,
  AreaDmg,
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
  // CrossLaser,
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
  MemoryUpgrade,
  XPUpgade,
}

export const enum MemoryUpgrade {
  Uglify = 2, // 15
  Gzip = 3, // 18
  ClosureCompiler = 4, // 22
  Roadroller = 5, // 27
  XemGolfing = 6, // 33
}
export const MEMORY_UPGRADES = [
  MemoryUpgrade.Uglify,
  MemoryUpgrade.Gzip,
  MemoryUpgrade.ClosureCompiler,
  MemoryUpgrade.Roadroller,
  MemoryUpgrade.XemGolfing,
];

export const AUTOUPGADEBLE_WEAPONS = [
  WeaponType.Spikes,
  WeaponType.Field,
  WeaponType.CrossLaser,
];

export type MemoryItem =
  | [MemoryType.Weapon, WeaponType, number]
  | [MemoryType.Upgrade, UpgradeType]
  | [MemoryType.MemoryUpgrade, MemoryUpgrade]
  | [MemoryType.XPUpgade, number];
export type Memory = Array<MemoryItem>;
