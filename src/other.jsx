import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import { geoRotation, geoContains, geoAzimuthalEqualArea } from "d3";
const world = topojson.feature(topology, topology.objects.units);

const Main = () => {
  const width = 500;
  const height = 500;

  const padding = 10;

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (width / 630) * 100;

  const nightColors = {
    sea: "#000",
    graticule: "#442000",
    land: "#ff6a0f",
    border: "#442000",
  };

  const dayColors = {
    sea: "#fff",
    graticule: "#c2deff",
    land: "#00a6f0",
    border: "#004e70",
  };

  let [angle, setAngle] = useState(0);

  // useEffect(() => {
  //   let id = setInterval(() => {
  //     setAngle((a) => {
  //       let newAngle = a + 0.1;
  //       if (newAngle == 360) {
  //         return 0;
  //       } else {
  //         return newAngle;
  //       }
  //     });
  //   }, 10);
  //   return () => clearInterval(id);
  // }, []);

  let mapSvg = (colors) => (
    <CustomProjection
      data={world.features}
      projection={geoAzimuthalEqualArea}
      // scale={scale}
      // translate={[centerX, centerY]}
      // fitExtent={[
      //   [
      //     [padding, padding],
      //     [width - padding, height - padding],
      //   ],
      //   world,
      // ]}
      translate={[centerX, centerY]}
      rotate={[angle, -90, 0]}
    >
      {(projection) => {
        return (
          <g>
            <Graticule
              outline={(o) => projection.path(o) || ""}
              fill={colors.sea}
              stroke={colors.graticule}
            />

            <Graticule
              graticule={(g) => projection.path(g) || ""}
              stroke={colors.graticule}
            />

            {projection.features.map(({ feature, path }, i) => (
              <path
                key={`map-feature-${i}`}
                d={path || ""}
                fill={colors.land}
                stroke={colors.border}
                strokeWidth={0.5}
              />
            ))}

            <Graticule
              outline={(o) => projection.path(o) || ""}
              fill={"red"}
              fillOpacity={0.0}
              strokeOpacity={0.0}
              id={"outline"}
              onClick={(e) => {}}
            />
          </g>
        );
      }}
    </CustomProjection>
  );

  return (
    <div className="relative w-fit p-6">
      <svg width={width} height={height}>
        <defs>
          <clipPath id="halfClip">
            <rect
              x="0"
              y="0"
              width={width / 2}
              height={height}
              transform={`rotate(45, ${width / 2}, ${height / 2})`}
            />
          </clipPath>

          <filter id="invertFilter">
            <feComponentTransfer>
              <feFuncR type="table" tableValues="1 0" />
              <feFuncG type="table" tableValues="1 0" />
              <feFuncB type="table" tableValues="1 0" />
            </feComponentTransfer>
          </filter>
        </defs>

        {mapSvg(dayColors)}
        <g clip-path="url(#halfClip)">{mapSvg(nightColors)}</g>
      </svg>
    </div>
  );
};

export default Main;
