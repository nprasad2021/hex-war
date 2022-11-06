import React from 'react';
import { ethers } from "ethers";
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { HexGrid, Layout, Hexagon, Text, Pattern, Path, HexUtils } from 'react-hexgrid';

import { apiv2 as api } from './api';
import * as Coords from "./structs/coords";
import * as Orientation from "./structs/orientation";

import { Context } from "./webthree";

const OPTIONS = {
  size: { x: 5, y: 5 },
  origin: { x: 0, y: 0 },
  orientation: Orientation.POINTY,
}

type THex = {
  a: number,
  b: number,
  c: number,
  id: number,
  owner: string,
}

function App() {
  const context = React.useContext(Context);

  const gridElRef = React.useRef<HTMLDivElement | null>(null);
  const dragElRef = React.useRef<HTMLDivElement | null>(null);
  const dragPositionRef = React.useRef<[number, number]>([0, 0]);
  const dragMousedownRef = React.useRef<boolean>(false);

  const [board, setBoard] = React.useState<Array<THex>>([]);
  const colorRef = React.useRef<Record<string, string>>({});
  const [selectedVertex, setSelectedVertex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchBoardV2 = async () => {
      const API = new api(null);
      const response = await API.board();
      // console.log(response)
      const newBoard = response.map(hex => ({
        a: hex.loc.a,
        b: hex.loc.b,
        c: hex.loc.c,
        id: hex.id.toNumber(),
        owner: hex.owner,
      }))

      const owners = new Set(newBoard.map((hex) => hex.owner));
      const colors: Record<string, string> = [...owners].reduce((acc, owner) => {
        // @ts-ignore
        acc[owner] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        return acc;
      }, {});

      setBoard(newBoard)
      colorRef.current = {
        ...colors,
        ...colorRef.current,
      }
      
    }
    fetchBoardV2();
    const intervalRef = setInterval(fetchBoardV2, 1_000);
    return () => {
      clearInterval(intervalRef);
    }
  }, [])

  React.useLayoutEffect(() => {
    const gridEl = gridElRef.current;
    const dragEl = dragElRef.current;

    if (dragEl === null) return;
    if (gridEl === null) return;

    const handler1 = (e: MouseEvent) => {
      dragPositionRef.current = [
        gridEl.offsetLeft - e.clientX,
        gridEl.offsetTop - e.clientY,
      ];
      dragMousedownRef.current = true;
    };
    const handler2 = () => {
      dragMousedownRef.current = false;
    };
    const handler3 = (e: MouseEvent) => {
      e.preventDefault();
      if (dragMousedownRef.current) {
        gridEl.style.top = `${e.clientY + dragPositionRef.current[1]}px`;
        gridEl.style.left = `${e.clientX + dragPositionRef.current[0]}px`;
      }
    };

    dragEl.addEventListener("mousedown", handler1);
    document.addEventListener("mouseup", handler2);
    document.addEventListener("mousemove", handler3);

    // return () => {
    //   dragEl.removeEventListener("mousedown", handler1);
    //   document.removeEventListener("mouseup", handler2);
    //   document.removeEventListener("mousemove", handler3);
    // }
  }, []);

  const owners = new Set(board.map((hex) => hex.owner));
  // const colorsArray = new Array(owners.size).fill(0).map(() => {
  //   return `#${Math.floor(Math.random()*16777215).toString(16)}`;
  // });
  // @ts-ignore


  const cubeCoords = board.map((hex) => new Coords.Cube(hex.a, hex.b, hex.c));
  const offsetCoords = [
    ...new Set(
      cubeCoords.map((cube) => Coords.Offset.fromCube(cube).toString())
    ),
  ].map(Coords.Offset.fromString);

  // const testCube = new Coords.Cube(1, -3, 0);
  // console.log("TODO - buggy case here when converting to offset coord", testCube.getCenterCubes())
  // console.log(testCube.getCenterCubes().map(Coords.Offset.fromCube))

  // Maps hexagon offset coordinates to all the cube coordinates related to that offset
  const associations = new Map();
  board.forEach((boardItem) => {
    if (boardItem.a === 0 && boardItem.b === 0 && boardItem.c === 0) {
      return;
    }

    const cube = new Coords.Cube(boardItem.a, boardItem.b, boardItem.c);
    const centerCubes = cube.getCenterCubes();
    const offsetCoords = centerCubes.map(cube => cube.toPixelString(OPTIONS));
    // console.log(offsetCoords)
    
    // console.log("cube", cube, "offsetCoords", offsetCoords);

    offsetCoords.forEach((offset) => {
      const existing = associations.get(offset);
      if (existing) {
        associations.set(offset, [...existing, boardItem]);
      } else {
        associations.set(offset, [boardItem]);
      }
    });
  });

  const mintNft = async () => {
    const ethersProvider = context.provider;
    if (ethersProvider) {
      const API = new api(null);
      const signer = await ethersProvider.getSigner();
      const txnData = await API.freeMint();
      if (txnData) {
        // const signData = await signer.signTransaction(txnData);
        const txn = await signer.sendTransaction(txnData);
        console.log("txn", txn)
      }
    }

    // console.log(txnData);
  }
  const expandMintNft = async () => {
    const ethersProvider = context.provider;
    if (ethersProvider) {
    }

    // console.log(txnData);
  }

  // console.log(board)

  const colors = colorRef.current;

  return (
    <StyledRoot>
      <div ref={dragElRef} className="main">
        <AutoSizer>
          {({ height, width }) => (
            <div ref={gridElRef} className="grid" style={{ width, height }}>
              <HexGrid width={width} height={height} className="grid">
                <Layout
                  flat={OPTIONS.orientation.name === "flat"}
                  size={OPTIONS.size}
                  origin={OPTIONS.origin}
                  spacing={1.05}
                >
                  <React.Fragment>
                    {board.map(({ owner, ...cube }) => {
                      const cubeCoord = new Coords.Cube(cube.a, cube.b, cube.c)
                      const offsetCoord = Coords.Offset.fromCube(cubeCoord)
                      const relatedBoardItems = associations.get(cubeCoord.toPixelString(OPTIONS));
                      const ownerCounts = new Map<string, number>();
                      relatedBoardItems.map((boardItem: any) => {
                        const existing = ownerCounts.get(boardItem.owner);
                        if (typeof existing === "number") {
                          ownerCounts.set(boardItem.owner, existing + 1)
                        } else {
                          ownerCounts.set(boardItem.owner, 1)
                        }
                      })
                      // console.log(ownerCounts)
                      let majorityOwner: string | null = null;
                      let majorityOwnerCount: number = 0;
                      Array.from(ownerCounts.entries()).map(([owner, count]) => {
                        if (count > 2 && count > majorityOwnerCount) {
                          majorityOwner = owner;
                          majorityOwnerCount = count;
                        }
                      })
                      // console.log(majorityOwner)

                      return (
                        <Hexagon
                          q={cubeCoord.x}
                          s={cubeCoord.y}
                          r={cubeCoord.z}
                          style={{ fill: majorityOwner ? colors[majorityOwner] : "black" }}
                          className={`hexagon`}
                        />
                      );
                    })}
                    <g>
                      {board.map(({ id, owner, ...cube }) => {
                        const pixelCoords = Coords.Pixel.fromCube(
                          new Coords.Cube(cube.a, cube.b, cube.c),
                          OPTIONS
                        );
                        // if (pixelCoords.x === 0 && pixelCoords.y === 0) {
                        //   return null;
                        // }
                        return (
                          <circle
                            r="1"
                            id={`${id}`}
                            cx={pixelCoords.x}
                            cy={pixelCoords.y}
                            style={{
                              fill: selectedVertex === id ? "white" : colors[owner],
                              stroke: "black",
                              strokeWidth: 0.5,
                            }}
                            onClick={() => setSelectedVertex(id)}
                            className="vertex"
                          />
                        );
                      })}
                    </g>
                  </React.Fragment>
                </Layout>
              </HexGrid>
            </div>
          )}
        </AutoSizer>
      </div>
      <div className="side">
        <div className="title">Hex War</div>
        <div style={{ display: "flex", marginBottom: "36px" }}>
          {context.address ? <div style={{ color: colors[context.address], fontSize: "24px" }}>you: {context.address.slice(0, 8)}...</div> : <button style={{ marginRight: "16px" }} onClick={() => context.connect()}>connect</button>}
        </div>
        {Object.entries(colors).map(([address, color]) => (
          <div style={{ display: "flex", marginTop: "8px" }}>
            <div style={{ width: "24px", height: "24px", background: color, borderRadius: "50%" }} />
            <div style={{ color: "black", fontSize: "24px", marginLeft: "24px" }}>{address.slice(0, 8)}...</div>
          </div>
        ))}
        <div style={{ display: "flex", marginTop: "36px" }}>
          <button style={{ fontSize: "16px" }} onClick={mintNft}>Free mint</button>
          {selectedVertex !== null && <button style={{ fontSize: "16px" }} onClick={expandMintNft}>expand mint</button>}
        </div>
      </div>
    </StyledRoot>
  );
}

const StyledRoot = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  background: ${({ theme }) => theme.color.inkwell};

  grid-template-rows: 1fr;
  grid-template-areas: "main side";
  grid-template-columns: 1fr 400px;

  .main {
    position: relative;
    grid-area: main;
  }

  .grid {
    top: 0;
    left: 0;
    position: absolute;
  }

  .side {
    height: 100%;
    z-index: 1;
    padding: 24px;
    grid-area: side;
    background: #3b4252;
    border-left: 1px solid black;
  }

  .title {
    color: #eceff4;
    font-size: 64px;
  }

  .vertex {
    fill: white;
  }
`;

function getMajorityOwner() {

}

export default App;