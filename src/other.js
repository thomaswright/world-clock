import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import { geoRotation, geoContains } from "d3";
import * as utils from "./utils.js";
const world = topojson.feature(topology, topology.objects.units);

const Main = () => {
  const width = 500;
  const height = 250;

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (width / 630) * 100;

  const colors = {
    sea: "#c5e8f8",
    graticule: "#b2d2e0",
    land: "#f2e7c3",
    border: "#a29c83",
  };

  return (
    <svg width={width} height={height}>
      <CustomProjection
        data={world.features}
        projection={"equalEarth"}
        scale={scale}
        translate={[centerX, centerY]}
        rotate={[0, 0, 0]}
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
    </svg>
  );
};

export default Main;
