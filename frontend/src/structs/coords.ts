import * as Orientation from "./orientation";

export class Cube {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Pixel {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static fromCube(
    cube: Cube,
    options: {
      size: { x: number; y: number };
      origin: { x: number; y: number };
      orientation: Orientation.Orientation;
    }
  ): Pixel {
    const {
      size,
      origin,
      orientation
    } = options;

    const x: number =
      (orientation.f0 * cube.x + orientation.f1 * cube.z) * size.x;
    const y: number =
      (orientation.f2 * cube.x + orientation.f3 * cube.z) * size.y;

    return new Pixel(x + origin.x, y + origin.y);
  }
}

export class Offset {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toCube(): Cube {
    const x = this.y - (this.x - (this.x & 1)) / 2;
    const z = this.x;
    const y = -x - z;
    return new Cube(x, y, z);
  }

  toString(): string {
    return JSON.stringify(this);
  }

  static fromCube(cube: Cube): Offset {
    return new Offset(cube.x + (cube.z - (cube.z & 1)) / 2, cube.z);
  }

  static fromString(string: string): Offset {
    const json = JSON.parse(string);
    return new Offset(json.x, json.y);
  }
}
