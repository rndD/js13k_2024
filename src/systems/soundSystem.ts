import { Sound, Timer } from "littlejsengine";

export const enum Sounds {
  enemyDie,
  enemyHit,
}

export class SoundSystem {
  timers!: Record<Sounds, Timer>;
  timersDurations!: Record<Sounds, number>;
  sounds = {
    [Sounds.enemyDie]: new Sound([
      ,
      ,
      136,
      0.22,
      ,
      0.08,
      1,
      2.5,
      1,
      ,
      66,
      0.03,
      0.05,
      ,
      ,
      ,
      ,
      0.93,
      ,
      ,
      -1068,
    ]),

    [Sounds.enemyHit]: new Sound([
      ,
      0.1,
      368,
      0.02,
      0.04,
      0.04,
      2,
      4.3,
      -1,
      ,
      -344,
      0.01,
      ,
      ,
      282,
      ,
      ,
      0.53,
      0.02,
      ,
      130,
    ]),
  };

  constructor() {
    // @ts-ignore
    this.timers = {};
    // @ts-ignore
    this.timersDurations = {};
    Object.keys(this.sounds).forEach((key: string) => {
      // @ts-ignore
      const s = this.sounds[key as Sounds];
      // default duration
      let duration = Array.isArray(s) ? s[1] : 0.1;
      // @ts-ignore
      this.timers[key] = new Timer(duration);
      // @ts-ignore
      this.timersDurations[key] = duration;
    });
  }

  play(sound: Sounds) {
    if (this.timers[sound].elapsed()) {
      this.sounds[sound].play();
      this.timers[sound].set(this.timersDurations[sound]);
    }
  }
}

export const soundSystem = new SoundSystem();
