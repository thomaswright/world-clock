import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import { geoAzimuthalEqualArea, geoCircle, geoPath } from "d3";
const world = topojson.feature(topology, topology.objects.units);
import * as solar from "solar-calculator";

let antipode = ([lon, lat]) => [lon + 180, -lat];

// sun code from https://observablehq.com/@d3/solar-terminator
let getSun = () => {
  const now = new Date();
  const day = new Date(+now).setUTCHours(0, 0, 0, 0);
  const t = solar.century(now);
  const longitude = ((day - now) / 864e5) * 360 - 180;
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

function rotatePoint(x, y, angle) {
  // Convert the angle from degrees to radians (if necessary)
  const radians = (angle * Math.PI) / 180;

  const cosTheta = Math.cos(radians); // angle in radians
  const sinTheta = Math.sin(radians);

  const xNew = x * cosTheta - y * sinTheta;
  const yNew = x * sinTheta + y * cosTheta;

  return [xNew, yNew];
}

const Main = () => {
  const centerX = width / 2;
  const centerY = height / 2;

  const nightColors = {
    sea: "#000",
    graticule: "#442000",
    land: "#ff6100",
    border: "#442000",
  };

  const dayColors = {
    sea: "#fff",
    graticule: "#c2deff",
    land: "#00b0ff",
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

  let paddingX = 600;
  let paddingY = 200;

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
    <div className=" w-fit p-6">
      <div className="relative">
        <div
          style={{
            paddingLeft: paddingX / 2 + "px",
            paddingTop: paddingY / 2 + "px",
          }}
        >
          <svg width={width} height={height}>
            <defs>
              <clipPath id="nightClip">
                <path
                  d={projectionPath(nightPath())}
                  transform={`rotate(0, ${centerX}, ${centerY}) translate(-230, 0) `}
                />
              </clipPath>
            </defs>

            {mapSvg(dayColors)}
            <g clipPath="url(#nightClip)">{mapSvg(nightColors)}</g>
          </svg>
        </div>

        <div className="absolute top-0 left-0 font-mono">
          <svg width={width + paddingX} height={height + paddingY}>
            <g>
              {[0, 90, 45, 180, 160].map((lon) => {
                let x = centerX + 20;
                let y = 0;
                let flipLabel = lon > 90 && lon < 270;
                return (
                  <g
                    transform={`translate(${centerX + paddingX / 2}, ${
                      centerY + paddingY / 2
                    })`}
                  >
                    <rect
                      x={x + 1}
                      y={y}
                      transform={`rotate(${lon}, 0,0)`}
                      width={"40"}
                      height={"2"}
                      fill={nightColors.land}
                    />
                    <g
                      transform={`rotate(${lon}, 0, 0) translate(${
                        x + 40
                      }, ${y}) `}
                    >
                      <g
                        transform={`rotate(${
                          flipLabel ? -lon + 180 : -lon
                        }, 0,0) translate(-1, 0)`}
                      >
                        <rect
                          x={0}
                          y={0}
                          width={"20"}
                          height={"2"}
                          fill={nightColors.land}
                        />
                        <g
                          transform={
                            "translate(30, 0) " +
                            (flipLabel ? "rotate(180, 0, 0) " : " ") +
                            (flipLabel ? "translate(0, 1)" : "translate(0, 3)")
                          }
                        >
                          <text
                            textAnchor={flipLabel ? "end" : "start"}
                            fill={nightColors.land}
                          >
                            Hello Everybody
                          </text>
                        </g>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Main;
