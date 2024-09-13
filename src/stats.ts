import { Color, rgb } from "littlejsengine";
import { IWeapon } from "./base/gameWeapon";
import { UpgradeType, WeaponType } from "./types";
import { ForceField, Mortar, Spikes, Sword } from "./weapons/area";
import { Gun } from "./weapons/projectile";

type KB = number;
type distance = number;
type damage = number;
type speed = number;
type lifeTime = number | undefined;
type dmgOverTime = number | undefined;
type size = number | undefined;
export type Stats = [KB, distance, damage, speed, lifeTime, dmgOverTime, size];

const ONLY_GROUND = "only ground enemies";

type IWEAPONS = Record<
  WeaponType,
  {
    w: { new (s: Stats): IWeapon };
    d: string[];
    i: string;
    [key: number]: Stats;
    c: Color;
  }
>;
export const WEAPONS: IWEAPONS = {
  [WeaponType.Gun]: {
    w: Gun,
    i: "🔫",
    // green
    c: rgb(0, 1, 0),
    d: ["MachineGun.js"],
    1: [2, 15, 1.3, 0.15, , , ,],
    2: [3, 16, 2, 0.12, , , ,],
    3: [5, 17, 3.8, 0.1, , , ,],
  },
  [WeaponType.Spikes]: {
    w: Spikes,
    i: "📌",
    // blue dark
    c: rgb(0, 0, 1),
    d: ["Spikes.js", ONLY_GROUND],
    // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
    1: [3, 15, 10, 4, , , 2.5],
    2: [5, 15, 18, 3.5, , , 3.5],
    3: [8, 15, 24, 3, , , 4.5],
  },
  [WeaponType.Mortar]: {
    w: Mortar,
    i: "💣",
    // red
    c: rgb(1, 0, 0),
    d: ["Mortar.js", ONLY_GROUND],
    //[KB, distance, damage, speed, lifeTime, dmgOverTime, size];
    1: [3, 15, 7, 2.5, 1, 1, 4.5],
    2: [5, 16, 10, 2, 1.5, 1.1, 5.5],
    3: [8, 18, 15, 1.8, 2, 1.2, 6.5],
  },
  [WeaponType.Field]: {
    w: ForceField,
    i: "🌀",
    // purple
    c: rgb(0.5, 0, 0.5),
    d: ["ForceField.js"],
    // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
    1: [3, 4, 2, 5, 2, , 4],
    2: [5, 4, 2.5, 4.5, 3, , 4.5],
    3: [6, 4, 3, 3, 3.5, , 5],
  },
  [WeaponType.Sword]: {
    w: Sword,
    i: "🔪",
    // grey
    c: rgb(0.5, 0.5, 0.5),
    d: ["Katana.js"],
    // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
    1: [2, 3.3, 10, 1, , , 3.5],
    2: [3, 4.5, 18, 0.8, , , 4.8],
    3: [5, 6, 25, 0.5, , , 6],
  },
  //   [WeaponType.CrossLaser]: {
  //     w: CrossLaser,
  //     i: "❌",
  //     // yellow
  //     c: rgb(1, 1, 0),
  //     d: ["CrossLaser.js", "horizontal", "vertical"],
  //     1: [2, 30, 0.3, 3.2, 2, , 0.5],
  //     2: [3, 30, 0.6, 2.6, 2, , 1],
  //     3: [4, 30, 1, 2.3, 2, , 2],
  //   },
};

type IUPGADES = Record<
  UpgradeType,
  {
    i: string;
    s: number;
  }
>;

export const UPGRADES_WITH_PERCENT = [
  UpgradeType.Damage,
  UpgradeType.Speed,
  UpgradeType.AttackSpeed,
];

export const UPGRADES: IUPGADES = {
  [UpgradeType.Damage]: {
    i: "💥",
    s: 3,
  },
  [UpgradeType.Speed]: {
    i: "🏃",
    s: 4,
  },
  [UpgradeType.Health]: {
    i: `💔`,
    s: 5,
  },
  [UpgradeType.AttackSpeed]: {
    i: "🕒",
    s: 5,
  },
  //   [UpgradeType.Armor]: {
  //     i: "🛡️",
  //     s: 3,
  //   },
  [UpgradeType.HpRegen]: {
    i: "❤️‍🩹",
    s: 2,
  },
};
