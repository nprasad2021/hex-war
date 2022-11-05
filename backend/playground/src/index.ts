type Hex = {a: number; b: number; c: number};
function getKey(hex: Hex): string {
  return `${hex.a};${hex.b};${hex.c}`;
}

const startHex: Hex = {a: 0, b: 0, c: 0};
function getAdjacentVertexes(hex: Hex): Hex[] {
  const newHexes: Hex[] = [{...hex, a: hex.a + 1}, {...hex, a: hex.a - 1}, {...hex, b: hex.b + 1}, {...hex, b: hex.b - 1}, {...hex, c: hex.c - 1}, {...hex, c: hex.c + 1}];
  return newHexes.filter((nhex) => (nhex.a + nhex.b + nhex.c) % 3 !== 0);
}
function getRandomHexes(){
  const masterList: Hex[] = [];
  const seen = new Set<string>();
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
    masterList.push(hex);
    const adjHexes = getAdjacentVertexes(hex);
    adjHexes.forEach((nextHex) => randomBfs(nextHex, maxDepth-1));
  }
  randomBfs(startHex, 10);
  return masterList;
}
getRandomHexes();