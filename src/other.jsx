import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import {
  geoAzimuthalEqualArea,
  geoCircle,
  geoPath,
  geoContains,
  geoConicConformal,
} from "d3";
const world = topojson.feature(topology, topology.objects.units);
import * as solar from "solar-calculator";
import * as cityTimeZones from "city-timezones";

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

let getSunPath = () => geoCircle().radius(90).center(getSun());

let getNightPath = () => geoCircle().radius(90).center(antipode(getSun()));

function rotatePoint(x, y, angle) {
  // Convert the angle from degrees to radians (if necessary)
  const radians = (angle * Math.PI) / 180;

  const cosTheta = Math.cos(radians); // angle in radians
  const sinTheta = Math.sin(radians);

  const xNew = x * cosTheta - y * sinTheta;
  const yNew = x * sinTheta + y * cosTheta;

  return [xNew, yNew];
}

let initialCities = [
  {
    city: "Seoul",
    city_ascii: "Seoul",
    lat: 37.5663491,
    lng: 126.999731,
    pop: 9796000,
    country: "South Korea",
    iso2: "KR",
    iso3: "KOR",
    province: "Seoul",
    timezone: "Asia/Seoul",
  },
  {
    city: "Beijing",
    city_ascii: "Beijing",
    lat: 39.92889223,
    lng: 116.3882857,
    pop: 9293300.5,
    country: "China",
    iso2: "CN",
    iso3: "CHN",
    province: "Beijing",
    timezone: "Asia/Shanghai",
  },
  {
    city: "Mumbai",
    city_ascii: "Mumbai",
    lat: 19.01699038,
    lng: 72.8569893,
    pop: 15834918,
    country: "India",
    iso2: "IN",
    iso3: "IND",
    province: "Maharashtra",
    timezone: "Asia/Kolkata",
  },
  {
    city: "London",
    city_ascii: "London",
    lat: 51.49999473,
    lng: -0.116721844,
    pop: 7994104.5,
    country: "United Kingdom",
    iso2: "GB",
    iso3: "GBR",
    province: "Westminster",
    timezone: "Europe/London",
  },
  // {
  //   city: "Chicago",
  //   city_ascii: "Chicago",
  //   lat: 41.82999066,
  //   lng: -87.75005497,
  //   pop: 5915976,
  //   country: "United States of America",
  //   iso2: "US",
  //   iso3: "USA",
  //   province: "Illinois",
  //   exactCity: "Chicago",
  //   exactProvince: "IL",
  //   state_ansi: "IL",
  //   timezone: "America/Chicago",
  // },
  {
    city: "New York",
    city_ascii: "New York",
    lat: 40.74997906,
    lng: -73.98001693,
    pop: 13524139,
    country: "United States of America",
    iso2: "US",
    iso3: "USA",
    province: "New York",
    state_ansi: "NY",
    timezone: "America/New_York",
  },
  {
    city: "San Francisco",
    city_ascii: "San Francisco",
    lat: 37.74000775,
    lng: -122.4599777,
    pop: 2091036,
    country: "United States of America",
    iso2: "US",
    iso3: "USA",
    province: "California",
    state_ansi: "CA",
    timezone: "America/Los_Angeles",
  },
];

let degreeTest = Array.from({ length: 36 }, (v, i) => {
  return {
    city: "San Francisco",
    lat: 0.0,
    lng: (i - 18) * 10,
    timezone: "America/Los_Angeles",
  };
});

function getTimeStringInTimezone(timezone) {
  const now = new Date();
  return now.toLocaleString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
}

const nightColors = {
  sea: "#000",
  graticule: "#442000",
  land: "#ff6100",
  border: "#442000",
  city: "#fff", //"#fff0e7",
};

const dayColors = {
  sea: "#fff",
  graticule: "#c2deff",
  land: "#00b0ff",
  border: "#004e70",
  city: "#000", //"#001420",
};

const Timezone = ({ flipLabel, city, timezone, color }) => {
  const [now, setNow] = useState("");

  useEffect(() => {
    let id = setInterval(() => {
      setNow(city + " " + getTimeStringInTimezone(timezone));
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <text textAnchor={flipLabel ? "end" : "start"} fill={color}>
      {now}
    </text>
  );
};

function crest(x) {
  return (1 - Math.sqrt((1 + Math.cos(x)) / 2)) ** 3;
}

const Main = () => {
  let [cities, setCities] = useState(degreeTest);

  let [currentNightPath, setCurrentNightPath] = useState(getNightPath());

  useEffect(() => {
    let id = setInterval(() => {
      setCurrentNightPath(getNightPath());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  //cityTimeZones.findFromCityStateProvince(location)

  const centerX = width / 2;
  const centerY = height / 2;

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
  let paddingY = 400;

  let offsetX = 50;
  let offsetY = 100;

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
                  d={projectionPath(currentNightPath)}
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
              {cities.map(({ lat: cityLat, lng: cityLon, city, timezone }) => {
                let [x, y] = projection()([cityLon, cityLat]);
                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let pointDiameter = 5;
                let pointRadius = pointDiameter / 2;

                return (
                  <g
                    transform={`translate(${70 - pointRadius}, ${
                      paddingY / 2 - pointRadius
                    })`}
                  >
                    <rect
                      x={x}
                      y={y}
                      rx={pointRadius}
                      width={pointDiameter}
                      height={pointDiameter}
                      fill={isNight ? nightColors.city : dayColors.city}
                    />
                  </g>
                );
              })}
              {cities.map(({ lat: cityLat, lng: cityLon, city, timezone }) => {
                let cityAngle = -cityLon + 90;
                let x = centerX + 20;
                let y = 0;
                let flipLabel = cityAngle > 90 && cityAngle < 270;
                let cityAngleRads = ((2 * cityAngle) / 180) * Math.PI;

                let additionalDist = crest(cityAngleRads) * 50;

                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let color = isNight ? nightColors.land : dayColors.land;
                return (
                  <g
                    transform={`translate(${centerX + paddingX / 2}, ${
                      centerY + paddingY / 2
                    })`}
                  >
                    <rect
                      x={x}
                      y={y}
                      transform={`rotate(${cityAngle}, 0,0)`}
                      width={40 + additionalDist}
                      height={"2"}
                      fill={color}
                    />
                    <g
                      transform={`rotate(${cityAngle}, 0, 0) translate(${
                        x + 40 + additionalDist
                      }, ${y}) `}
                    >
                      <g
                        transform={`rotate(${
                          flipLabel ? -cityAngle + 180 : -cityAngle
                        }, 0,0) translate(-1, 0)`}
                      >
                        <rect
                          x={1}
                          y={0}
                          width={20}
                          height={"2"}
                          fill={color}
                        />
                        <g
                          transform={
                            "translate(30, 0) " +
                            (flipLabel ? "rotate(180, 0, 0) " : " ") +
                            (flipLabel ? "translate(0, 1)" : "translate(0, 3)")
                          }
                        >
                          <Timezone
                            flipLabel={flipLabel}
                            city={city}
                            timezone={timezone}
                            color={color}
                          />
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
