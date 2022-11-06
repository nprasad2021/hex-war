import React from 'react';
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { HexGrid, Layout, Hexagon, Text, Pattern, Path, Hex } from 'react-hexgrid';

import { api } from './api';
import * as Coords from "./structs/coords";
import * as Orientation from "./structs/orientation";

const OPTIONS = {
  size: { x: 5, y: 5 },
  origin: { x: 0, y: 0 },
  orientation: Orientation.POINTY,
}

function App() {
  const gridElRef = React.useRef<HTMLDivElement | null>(null);
  const dragElRef = React.useRef<HTMLDivElement | null>(null);
  const dragPositionRef = React.useRef<[number, number]>([0, 0]);
  const dragMousedownRef = React.useRef<boolean>(false);

  const [board, setBoard] = React.useState<ReturnType<typeof api.board.get>>([])

  React.useEffect(() => {
    const fetchBoard = () => {
      setBoard(api.board.get())
    }
    fetchBoard();
  }, []);

  React.useLayoutEffect(() => {
    const gridEl = gridElRef.current;
    const dragEl = dragElRef.current;

    if (dragEl === null) return;
    if (gridEl === null) return;

    const handler1 = (e: MouseEvent) => {
      console.log("hi")
      dragPositionRef.current = [
        gridEl.offsetLeft - e.clientX,
        gridEl.offsetTop - e.clientY,
      ];
      dragMousedownRef.current = true;
    }
    const handler2 = () => {
      dragMousedownRef.current = false;
    }
    const handler3 = (e: MouseEvent) => {
      e.preventDefault();
      console.log("here")
      if (dragMousedownRef.current) {
        gridEl.style.top = `${e.clientY + dragPositionRef.current[1]}px`;
        gridEl.style.left = `${e.clientX + dragPositionRef.current[0]}px`;
      }
    }

    dragEl.addEventListener("mousedown", handler1);
    document.addEventListener("mouseup", handler2);
    document.addEventListener("mousemove", handler3);

    // return () => {
    //   dragEl.removeEventListener("mousedown", handler1);
    //   document.removeEventListener("mouseup", handler2);
    //   document.removeEventListener("mousemove", handler3);
    // }
  }, []);

  const cubeCoords = board.map((hex) => new Coords.Cube(hex.a, hex.b, hex.c));
  const offsetCoords = [
    ...new Set(
      cubeCoords.map((cube) => Coords.Offset.fromCube(cube).toString())
    ),
  ].map(Coords.Offset.fromString);

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
                    {cubeCoords.map((coord) => {
                      // const cube = coord.toCube();
                      return (
                        <Hexagon
                          q={coord.x}
                          s={coord.y}
                          r={coord.z}
                          className="hexagon"
                        />
                      );
                    })}
                    <g>
                      {cubeCoords.map((cube) => {
                        const pixelCoords = Coords.Pixel.fromCube(
                          cube,
                          OPTIONS
                        );
                        return (
                          <circle
                            r="1"
                            cx={pixelCoords.x}
                            cy={pixelCoords.y}
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

export default App;