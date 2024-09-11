import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import {
  geoRotation,
  geoContains,
  geoAzimuthalEqualArea,
  geoCircle,
  geoPath,
  geoNaturalEarth1,
} from "d3";
const world = topojson.feature(topology, topology.objects.units);
import * as solar from "solar-calculator";

let antipode = ([lon, lat]) => [lon + 180, -lat];

let getSun = () => {
  const now = new Date();
  const day = new Date(+now).setUTCHours(0, 0, 0, 0);
  const t = solar.century(now);
  const longitude = ((day - now) / 864e5) * 360 - 180;
  // return [90, 0];
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

let sun = getSun();
let projection = () => {
  return geoAzimuthalEqualArea().rotate([0, -90, 0]);
};
let projectionPath = geoPath(projection());

const width = 500;

const getHeight = () => {
  const [[x0, y0], [x1, y1]] = geoPath(
    projection().fitWidth(width, { type: "Sphere" })
  ).bounds({ type: "Sphere" });
  const dy = Math.ceil(y1 - y0),
    l = Math.min(Math.ceil(x1 - x0), dy);
  projection()
    .scale((projection().scale() * (l - 1)) / l)
    .precision(0.2);
  return dy;
};

const height = getHeight();

let sunPath = geoCircle().radius(90).center(sun);

let nightPath = geoCircle().radius(90).center(antipode(sun));

const Main = () => {
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
      projection={projection}
      translate={[centerX, centerY]}
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
          <clipPath id="nightClip">
            <path
              d={projectionPath(nightPath())}
              transform={`rotate(0, ${width / 2}, ${
                height / 2
              }) translate(-230, 0) `}
            />
          </clipPath>
        </defs>

        {mapSvg(dayColors)}
        <g clipPath="url(#nightClip)">{mapSvg(nightColors)}</g>
      </svg>
    </div>
  );
};

export default Main;
