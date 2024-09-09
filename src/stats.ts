import { IWeapon } from "./base/gameWeapon";
import { WeaponType } from "./types";
import { ForceField, Mortar, Spikes, Sword } from "./weapons/area";
import { CrossLaser } from "./weapons/laser";
import { Gun } from "./weapons/projectile";

type KB = number;
type distance = number;
type damage = number;
type speed = number;
type lifeTime = number | undefined;
type dmgOverTime = number | undefined;
type size = number | undefined;
export type Stats = [KB, distance, damage, speed, lifeTime, dmgOverTime, size];

type IWEAPONS = Record<
  WeaponType,
  { w: { new (s: Stats): IWeapon }; [key: number]: Stats }
>;
export const WEAPONS: IWEAPONS = {
  [WeaponType.Gun]: {
    w: Gun,
    1: [2, 15, 1.3, 0.15, , , ,],
    2: [3, 16, 2, 0.12, , , ,],
    3: [5, 17, 3.8, 0.1, , , ,],
  },
  [WeaponType.Spikes]: {
    w: Spikes,
    1: [3, 15, 10, 4, , , 2.5],
    2: [5, 15, 18, 3.5, , , 3.5],
    3: [8, 15, 24, 3, , , 4.5],
  },
  [WeaponType.Mortar]: {
    w: Mortar,
    1: [3, 15, 7, 2.5, 1, 1, 4.5],
    2: [5, 16, 10, 2, 1.5, 1.1, 5.5],
    3: [8, 18, 15, 1.8, 2, 1.2, 6.5],
  },
  [WeaponType.Field]: {
    w: ForceField,
    1: [3, 4, 2, 5, 2, , 4],
    2: [5, 4, 2.5, 4.5, 3, , 4.5],
    3: [6, 4, 3, 3, 3.5, , 5],
  },
  [WeaponType.Sword]: {
    w: Sword,
    1: [2, 3.5, 10, 1, , , 3.5],
    2: [3, 4.8, 18, 0.8, , , 4.8],
    3: [5, 6, 3, 25, 0.6, , 6],
  },
  [WeaponType.CrossLaser]: {
    w: CrossLaser,
    1: [2, 30, 0.3, 3.2, 2, , 0.5],
    2: [3, 30, 0.6, 2.6, 2, , 1],
    3: [4, 30, 1, 2.3, 2, , 2],
  },
};
