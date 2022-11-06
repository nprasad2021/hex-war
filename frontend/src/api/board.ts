type Hex = {
  a: number;
  b: number;
  c: number;
};

export function get(): Array<Hex & { owner: string }> {
  return simulateHexes().map(hex => ({
    ...hex,
    owner: owners[Math.floor(Math.random()*owners.length)]
  }));
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
  //   { a: 1, b: 0, c: 0 },
  //   { a: 0, b: 1, c: 0 }
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

const owners = [
  "0x121a184B7e0d081B9F745e0e9ec408d7C26560F2",
  "0x5dead1f49F17A4463956A5B6aabd6D96A900337D",
  "0x3Ae6280f3524001Dc74C20E152eF155E56a6BEeb"
]
