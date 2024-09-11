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

let sun = [-306.7858262609864, 4.314477025844753]; //getSun();

console.log(sun, solar);

const width = 500;
const height = 500;

let projection = geoAzimuthalEqualArea;
let projectionPath = geoPath(projection());

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
    <div className="relative w-fit">
      <svg width={width} height={height}>
        <defs>
          <clipPath id="halfClip">
            <path
              d={projectionPath(nightPath())}
              fill={"rgba(0,0,255,0.3"}
              transform={`rotate(0, ${width / 2}, ${
                height / 2
              }) translate(-230, 0) `}
            />
            {/* <rect
              x="0"
              y="0"
              width={width / 2}
              height={height}
              transform={`rotate(45, ${width / 2}, ${height / 2})`}
            /> */}
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
        {/* <path
          d={projectionPath(night())}
          fill={"rgba(255,0,255,0.3"}
          transform="translate(-230, 0)"
        /> */}
        <g clipPath="url(#halfClip)">{mapSvg(nightColors)}</g>
      </svg>
    </div>
  );
};

export default Main;
