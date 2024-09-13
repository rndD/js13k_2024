import { mainSystem } from "./mainSystem";
import {
  AUTOUPGADEBLE_WEAPONS,
  MEMORY_UPGRADES,
  MemoryItem,
  MemoryType,
} from "../types";
import { UPGRADES, WEAPONS } from "../stats";
import { rand, randInt } from "littlejsengine";

export const calcCurrentKb = () => {
  let currentKb = 0;
  mainSystem.m.forEach((m) => {
    if (m[0] === MemoryType.Weapon) {
      currentKb += WEAPONS[m[1]][m[2]][0];
    }
    if (m[0] === MemoryType.Upgrade) {
      currentKb += 1;
    }
  });

  return currentKb;
};

export const findNextMemoryUpgrade = (): number => {
  let maxUpgrade = 0;
  mainSystem.m.forEach((m) => {
    if (m[0] === MemoryType.MemoryUpgrade) {
      maxUpgrade = Math.max(maxUpgrade, m[1]);
    }
  });
  for (let i = 0; i < MEMORY_UPGRADES.length; i++) {
    if (MEMORY_UPGRADES[i] > maxUpgrade) {
      return MEMORY_UPGRADES[i];
    }
  }

  return 0;
};

export const chooseRandomItem = (position: number): MemoryItem => {
  const lastKb = mainSystem.getMaxMemory() - calcCurrentKb();
  let toChoose: MemoryItem;

  if (mainSystem.m.length > 0) {
    // for the first position if there is a memory for last weapon upgrade
    const lastItem = mainSystem.m[mainSystem.m.length - 1];
    const lastWeapon =
      lastItem[0] === MemoryType.Weapon && lastItem[2] < 3 ? lastItem : null;

    // do we have enough memory for the last weapon upgrade
    if (
      rand() < 0.5 &&
      position === 0 &&
      lastWeapon &&
      // @ts-ignore
      lastKb >= WEAPONS[lastWeapon[1]][lastWeapon[2] + 1][0]
    ) {
      return [MemoryType.Weapon, lastWeapon[1], lastWeapon[2] + 1];
    }

    if (
      (lastKb === 0 || (lastKb <= 3 && rand() < 0.5)) &&
      findNextMemoryUpgrade() > 0
    ) {
      return [MemoryType.MemoryUpgrade, findNextMemoryUpgrade()];
    }
  }

  const acc: MemoryItem[] = [];
  const weaponsAcc: MemoryItem[] = [];
  const upgradesAcc: MemoryItem[] = [];

  Object.keys(WEAPONS).forEach((key) => {
    const weapon = WEAPONS[key];
    if (lastKb >= weapon[1][0]) {
      acc.push([MemoryType.Weapon, Number(key), 1]);
    }
  });

  Object.keys(UPGRADES).forEach((key) => {
    const upgrade = UPGRADES[key];
    if (lastKb >= 1) {
      acc.push([MemoryType.Upgrade, Number(key)] as MemoryItem);
    }
  });

  if (position === 0 && weaponsAcc.length > 0 && rand() < 0.8) {
    toChoose = weaponsAcc[randInt(0, weaponsAcc.length - 1)];
    const alreadyExist = mainSystem.m.find(
      (mt) => mt[0] === toChoose[0] && mt[1] === toChoose[1]
    );
    if (!alreadyExist || !AUTOUPGADEBLE_WEAPONS.includes(toChoose[1])) {
      return toChoose;
    }
    if (
      alreadyExist[2] < 3 &&
      lastKb >= WEAPONS[toChoose[1]][alreadyExist[2] + 1][0]
    ) {
      return [MemoryType.Weapon, toChoose[1], alreadyExist[2] + 1];
    }
  }

  acc.push(...weaponsAcc, ...upgradesAcc);

  if (acc.length === 0) {
    return [MemoryType.XPUpgade, 500];
  }

  let t = 0;
  while (t < 10) {
    const item = acc[randInt(0, acc.length - 1)];
    if (item[0] === MemoryType.Weapon) {
      toChoose = item;
      const alreadyExist = mainSystem.m.find(
        (mt) => mt[0] === toChoose[0] && mt[1] === toChoose[1]
      );
      if (!alreadyExist || !AUTOUPGADEBLE_WEAPONS.includes(toChoose[1])) {
        return toChoose;
      }
      if (
        alreadyExist[2] < 3 &&
        lastKb >= WEAPONS[toChoose[1]][alreadyExist[2] + 1][0]
      ) {
        return [MemoryType.Weapon, toChoose[1], alreadyExist[2] + 1];
      }
    } else {
      return item;
    }

    t++;
  }
  // find appropriate memory items
};
