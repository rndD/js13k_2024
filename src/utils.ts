import { vec2, Vector2 } from "littlejsengine";

export function getAABB(target: Vector2, targetSize: Vector2) {
  const halfSize = targetSize.scale(0.5);
  return [
    target.add(halfSize),
    target.subtract(halfSize),
    target.add(vec2(halfSize.x, -halfSize.y)),
    target.add(vec2(-halfSize.x, halfSize.y)),
  ];
}

export function isAABBInRadius(
  pos: Vector2,
  radius: number,
  target: Vector2,
  targetSize: Vector2
): boolean {
  if (pos.distance(target) <= radius) {
    return true;
  }
  const AABB = getAABB(target, targetSize);
  for (let i = 0; i < 4; i++) {
    if (pos.distance(AABB[i]) <= radius) {
      return true;
    }
  }
  return false;
}
