type Hex = {
  a: number;
  b: number;
  c: number;
};

export function get(): Array<Hex> {
  return simulateHexes();
}

function getKey(hex: Hex): string {
  return `${hex.a};${hex.b};${hex.c}`;
}
function getAdjacentVertexes(hex: Hex): Hex[] {
  const newHexes: Hex[] = [
    { ...hex, a: hex.a + 1 },
    { ...hex, a: hex.a - 1 },
    { ...hex, b: hex.b + 1 },
    { ...hex, b: hex.b - 1 },
    { ...hex, c: hex.c - 1 },
    { ...hex, c: hex.c + 1 },
  ];
  return newHexes.filter((nhex) => (nhex.a + nhex.b + nhex.c) % 3 !== 0);
}
function simulateHexes(size: number = 6) {
  // return [
  //   { a: 0, b: 0, c: 0 },
  //   { a: 1, b: 0, c: 0 }
  // ]

  const list: Hex[] = [];
  const seen = new Set<string>();
  const startHex: Hex = { a: 0, b: 0, c: 0 };

  function randomBfs(hex: Hex, maxDepth: number) {
    if (Math.random() < 0.2) {
      return;
    }
    if (maxDepth === 0) {
      return;
    }
    if (seen.has(getKey(hex))) {
      return;
    }

    seen.add(getKey(hex));
    list.push(hex);

    const adjHexes = getAdjacentVertexes(hex);
    adjHexes.forEach((nextHex) => randomBfs(nextHex, maxDepth - 1));
  }

  randomBfs(startHex, size);

  return list;
}
