import * as Orientation from "./orientation";

export class Cube {
  static DIRECTIONS = [
    new Cube(1, 0, -1),
    new Cube(1, -1, 0),
    new Cube(0, -1, 1),
    new Cube(-1, 0, 1),
    new Cube(-1, 1, 0),
    new Cube(0, 1, -1),
  ]

  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  getCenterCubes(): Array<Cube> {
    const json = { x: this.x, y: this.y, z: this.z };
    const neighbourCubes = [
      { ...json, x: json.x + 1 },
      { ...json, x: json.x - 1 },
      { ...json, y: json.y + 1 },
      { ...json, y: json.y - 1 },
      { ...json, z: json.z - 1 },
      { ...json, z: json.z + 1 },
    ];
    const centerCubesJson = neighbourCubes.filter(
      (cube) => (cube.x + cube.y + cube.z) % 3 === 0
    );
    return centerCubesJson.map((cube) => new Cube(cube.x, cube.y, cube.z));
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
      (cube.x * Math.cos(30 * (Math.PI / 180)) -
        cube.y * Math.cos(30 * (Math.PI / 180))) *
      size.x;
      // cube.x * size.x * Math.cos(30 * (Math.PI / 180)) -
      // cube.z * size.x * Math.cos(30 * (Math.PI / 180));


      // (orientation.f0 * cube.x + orientation.f1 * cube.z) * size.x;
    const y: number =
      (cube.z - cube.x / 2 - cube.y / 2) * size.y
      // cube.y * size.y - (cube.x / 2 + cube.z / 2) * size.y


      // (cube.y / 2 - cube.z / 2) * size.y
      // cube.z * size.y - (cube.x / 2 + cube.y / 2) * size.y
      // (orientation.f2 * cube.x + orientation.f3 * cube.z) * size.y;

    return new Pixel(x, y);
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
    return new Offset(cube.x + (cube.z + (cube.z % 2)) / 2, cube.z);
  }

  static fromString(string: string): Offset {
    const json = JSON.parse(string);
    return new Offset(json.x, json.y);
  }
}
