import { ASSERT, hsl, ParticleEmitter, PI, Vector2 } from "littlejsengine";
import { mainSystem } from "../systems/mainSystem";
const persistentParticleDestroyCallback = (particle: any) => {
  // copy particle to tile layer on death
  ASSERT(
    !particle.tileInfo,
    "quick draw to tile layer uses canvas 2d so must be untextured"
  );
  if (particle.groundObject)
    // @ts-ignore
    mainSystem.floorTile.drawTile(
      particle.pos,
      particle.size,
      particle.tileInfo,
      particle.color,
      particle.angle,
      particle.mirror
    );
};

export function makeBlood(pos: Vector2, amount: number) {
  makeDebris(pos, hsl(0, 1, 0.5), amount, 0.1, 0);
}
export function makeDebris(
  pos: Vector2,
  color = hsl(),
  amount = 50,
  size = 0.2,
  elasticity = 0.3
) {
  const color2 = color.lerp(hsl(), 0.5);
  const emitter = new ParticleEmitter(
    pos,
    0,
    1,
    0.1,
    amount / 0.1,
    PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
    0, // tileInfo
    color,
    color2, // colorStartA, colorStartB
    color,
    color2, // colorEndA, colorEndB
    0.3,
    size,
    size,
    0.1,
    0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
    0.5,
    0.95,
    0.4,
    PI,
    0, // damp, angleDamp, gravity, particleCone, fade
    0.5,
    1 // randomness, collide, additive, colorLinear, renderOrder
  );
  emitter.elasticity = elasticity;
  emitter.particleDestroyCallback = persistentParticleDestroyCallback;
  return emitter;
}
