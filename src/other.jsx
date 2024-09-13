import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState, useRef } from "react";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import { geoAzimuthalEqualArea, geoCircle, geoPath, geoContains } from "d3";
const world = topojson.feature(topology, topology.objects.units);
import * as solar from "solar-calculator";
import * as cityTimeZones from "city-timezones";

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

// Constants

let DAY_MILLISECONDS = 1000 * 60 * 60 * 24;

// # Options

// const nightColors = {
//   sea: "#00204d",
//   graticule: "#384e98",
//   land: "#27A65A",
//   border: "#003301",
//   city: "#fff",
// };

// const dayColors = {
//   sea: "#b6e3ff",
//   graticule: "#60a9ff",
//   land: "#f1dcc2",
//   border: "#806127",
//   city: "#000",
// };

// const weekdayColors = {
//   day1: "rgb(255 111 142)",
//   day2: "rgb(255 222 91)",
// };

const nightColors = {
  sea: "#000",
  graticule: "#442000",
  land: "#ff6100",
  border: "#442000",
  city: "#fff",
};

const dayColors = {
  sea: "#fff",
  graticule: "#c2deff",
  land: "#00b0ff",
  border: "#004e70",
  city: "#000",
};

const weekdayColors = {
  day1: dayColors.land,
  day2: nightColors.land,
};

let timeValWidth = DAY_MILLISECONDS * 3;
let dayValWidth = 360;

// # Main

let antipode = ([lon, lat]) => [lon + 180, -lat];

// sun code from https://observablehq.com/@d3/solar-terminator
let getSun = (time) => {
  const day = new Date(+time).setUTCHours(0, 0, 0, 0);
  const t = solar.century(time);
  const longitude = ((day - time) / 864e5) * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

const width = 500;

let getProjection = (rotation) => () => {
  return geoAzimuthalEqualArea()
    .scale(width / 4)

    .rotate([rotation, -90, 0])
    .translate([width / 2, width / 2]);
};

const getHeight = () => {
  const [[x0, y0], [x1, y1]] = geoPath(
    getProjection(-90)().fitWidth(width, { type: "Sphere" })
  ).bounds({ type: "Sphere" });
  const dy = Math.ceil(y1 - y0),
    l = Math.min(Math.ceil(x1 - x0), dy);
  getProjection(-90)()
    .scale((getProjection(-90)().scale() * (l - 1)) / l)
    .precision(0.2);
  return dy;
};

const height = getHeight();

let getNightPath = (time) => {
  return geoCircle()
    .radius(90)
    .center(antipode(getSun(time)));
};

function getTimeStringInTimezone(time, timezone) {
  return time.toLocaleString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const dayOfYear = Math.ceil(diff / DAY_MILLISECONDS);
  return dayOfYear;
}

function getDateRotation(time) {
  let summerSolstice = 173;
  let dayOffset = getDayOfYear(time) - summerSolstice;
  return (dayOffset / 365) * 360;
}

function getDayRotation(time) {
  const secondsPassed =
    time.getUTCHours() * 3600 +
    time.getUTCMinutes() * 60 +
    time.getUTCSeconds();
  const totalSecondsInDay = 86400;
  const percentageOfDayPassed = secondsPassed / totalSecondsInDay;
  return percentageOfDayPassed * 360;
}

function dayString(time) {
  let result = time.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return result;
}

function getTomorrowDayString(time) {
  let tomorrow = new Date(time.getTime() + DAY_MILLISECONDS);

  return dayString(tomorrow);
}

function getYesterdayDayString(time) {
  let yesterday = new Date(time.getTime() - DAY_MILLISECONDS);

  return dayString(yesterday);
}

function getTodayDayString(time) {
  return dayString(time);
}

const Timezone = ({ time, flipLabel, city, timezone, color }) => {
  const [now, setNow] = useState(time.getTime());

  useEffect(() => {
    let id = setInterval(() => {
      setNow((v) => v + 1000);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setNow((_) => time.getTime());
  }, [time]);

  let text = city + " " + getTimeStringInTimezone(new Date(now), timezone);

  return (
    <text textAnchor={flipLabel ? "end" : "start"} fill={color}>
      {text}
    </text>
  );
};

function crest(x) {
  return (1 - Math.sqrt((1 + Math.cos(x)) / 2)) ** 3;
}

function dayNum(time) {
  return Math.floor(time.getTime() / DAY_MILLISECONDS);
}

function dayParity(time) {
  return dayNum(time) % 2 === 0;
}

function dayTimezoneParity(date, timezone) {
  let dateString = new Date(date).toLocaleString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [month, day, year] = dateString.split("/");
  let localDate = new Date(Date.UTC(year, month - 1, day));
  let daysSinceEpoch = Math.floor(localDate.getTime() / DAY_MILLISECONDS);

  return daysSinceEpoch % 2 === 0;
}

const SvgArc = ({
  id,
  text,
  cx,
  cy,
  r,
  startAngle,
  endAngle,
  clockwise,
  stroke = "red",
  fill = "transparent",
  strokeWidth = 1,
  time,
}) => {
  let hours = time.getUTCHours();
  let arcSwitch = hours >= 12 && hours < 24;

  let getLengthFlags = () => {
    return arcSwitch ? (clockwise ? "1 1" : "0 0") : clockwise ? "0 1" : "1 0";
  };

  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef(null);

  // Convert angles from degrees to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  // Calculate the start point of the arc
  const x1 = cx + r * Math.cos(startAngleRad);
  const y1 = cy + r * Math.sin(startAngleRad);

  // Calculate the end point of the arc
  const x2 = cx + r * Math.cos(endAngleRad);
  const y2 = cy + r * Math.sin(endAngleRad);

  let tr = r + 8;

  // Calculate the start point of the arc
  const tx1 = cx + tr * Math.cos(startAngleRad);
  const ty1 = cy + tr * Math.sin(startAngleRad);

  // Calculate the end point of the arc
  const tx2 = cx + tr * Math.cos(endAngleRad);
  const ty2 = cy + tr * Math.sin(endAngleRad);

  const calcStartOffset = (percentage, extraPx, pathLength) => {
    return percentage * pathLength + extraPx;
  };

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [time]);

  return (
    <g>
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${getLengthFlags()} ${x2} ${y2}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={clockwise ? "2,5" : "2,5"}
        fill={fill}
      />
      <path
        ref={pathRef}
        id={id}
        d={`M ${tx1} ${ty1} A ${tr} ${tr} 0 ${getLengthFlags()} ${tx2} ${ty2}`}
        stroke={"none"}
        strokeWidth={strokeWidth}
        fill={"none"}
      />
      <text fill={stroke} fontSize="16">
        <textPath
          href={`#${id}`}
          startOffset={"35%"}
          textAnchor="start"
          side={clockwise ? "left" : "right"}
        >
          {text}
        </textPath>
      </text>
      {/*       
      <text fill={stroke} fontSize="16">
        <textPath
          href={`#${id}`}
          startOffset="10px"
          textAnchor="start"
          side={clockwise ? "left" : "right"}
        >
          {text}
        </textPath>
      </text>
      <text fill={stroke} fontSize="16">
        <textPath
          href={`#${id}`}
          startOffset={calcStartOffset(1.0, -10, pathLength)}
          textAnchor="end"
          side={clockwise ? "left" : "right"}
        >
          {text}
        </textPath>
      </text> */}
    </g>
  );
};

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
  let now = new Date();

  let [cities, setCities] = useState(initialCities);
  let [inputDate, setInputDate] = useState(new Date(now.getTime()));
  let initialTimeVal = timeValWidth / 2;
  let [timeVal, setTimeVal] = useState(timeValWidth / 2);
  let initialDayVal = dayValWidth / 2;
  let [dayVal, setDayVal] = useState(initialDayVal);

  let [nowDate, setNowDate] = useState(new Date());
  let pickedDate = Boolean(inputDate) ? inputDate : nowDate;

  useEffect(() => {
    let updateStep = 5000;

    let id = setInterval(() => {
      setNowDate(new Date());
      setInputDate((v) =>
        Boolean(v) ? new Date(v.getTime() + updateStep) : v
      );
    }, updateStep);
    return () => clearInterval(id);
  }, []);

  let currentNightPath = getNightPath(pickedDate)();
  let dateRotation = getDateRotation(pickedDate);
  let dayRotation = getDayRotation(pickedDate);
  let totalRotation = ((dateRotation + dayRotation) % 360) - 180;

  //cityTimeZones.findFromCityStateProvince(location)

  const centerX = width / 2;
  const centerY = height / 2;

  let paddingX = 800;
  let paddingY = 300;

  let mapSvg = (colors) => (
    <CustomProjection
      data={world.features}
      projection={getProjection(totalRotation)}
    >
      {(projection) => {
        return (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={centerX - 1}
              fill={colors.sea}
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
          </g>
        );
      }}
    </CustomProjection>
  );

  let dateline = (time) => {
    let dayEndAngle = -(totalRotation + 90);
    let dayStartAngle = -totalRotation + dayRotation + 90;
    let strokeWidth = 3;
    let beforeNoon = time.getUTCHours() < 12;
    let swap = dayParity(time) === beforeNoon;
    let color1 = swap ? weekdayColors.day1 : weekdayColors.day2;
    let color2 = swap ? weekdayColors.day2 : weekdayColors.day1;
    let today = getTodayDayString(time);
    let tomorrow = getTomorrowDayString(time);
    let yesterday = getYesterdayDayString(time);
    let [text1, text2] = beforeNoon ? [yesterday, today] : [today, tomorrow];
    let bookendHeight = 12;
    let bookendWidth = 8;
    let bookendOffset = 5;
    return (
      <g
        transform={`translate(${centerX + paddingX / 2}, ${
          centerY + paddingY / 2
        })`}
      >
        <SvgArc
          id={"clockwise"}
          text={text1}
          cx={0}
          cy={0}
          r={centerX + 5}
          startAngle={dayStartAngle}
          endAngle={dayEndAngle}
          clockwise={true}
          stroke={color1}
          strokeWidth={strokeWidth}
          time={pickedDate}
        />
        <SvgArc
          id={"counter-clockwise"}
          text={text2}
          cx={0}
          cy={0}
          r={centerX + 5}
          startAngle={dayStartAngle}
          endAngle={dayEndAngle}
          clockwise={false}
          stroke={color2}
          strokeWidth={strokeWidth}
          time={pickedDate}
        />
        <rect
          x={centerX}
          y={bookendOffset}
          transform={`rotate(${dayStartAngle}, 0,0)`}
          width={bookendHeight}
          height={bookendWidth}
          fill={color1}
        />
        <rect
          x={centerX}
          y={-bookendOffset}
          transform={`rotate(${dayStartAngle}, 0,0)`}
          width={bookendHeight}
          height={bookendWidth}
          fill={color2}
        />
        <rect
          x={centerX}
          y={bookendOffset}
          transform={`rotate(${dayEndAngle}, 0,0)`}
          width={bookendHeight}
          height={bookendWidth}
          fill={color2}
        />
        <rect
          x={centerX}
          y={-bookendOffset}
          transform={`rotate(${dayEndAngle}, 0,0)`}
          width={bookendHeight}
          height={bookendWidth}
          fill={color1}
        />
      </g>
    );
  };

  return (
    <div className=" w-fit p-6">
      {/* <div className="text-white">{pickedDate.toISOString()}</div> */}
      <div className="text-white">Adjust Time</div>
      <input
        className=" w-96"
        type="range"
        min={0}
        max={timeValWidth}
        value={timeVal}
        step={1000 * 60 * 10}
        onChange={(e) => {
          let newValue = parseInt(e.target.value);
          let diff = newValue - timeVal;
          let base = Boolean(inputDate)
            ? inputDate.getTime()
            : nowDate.getTime();
          let newDate = new Date(base + diff);
          setTimeVal(newValue);
          setInputDate(newDate);
        }}
      />
      <div className="text-white">Adjust Day</div>
      <input
        className=" w-96"
        type="range"
        min={0}
        max={dayValWidth}
        value={dayVal}
        step={1}
        onChange={(e) => {
          let newValue = parseInt(e.target.value);
          let diff = newValue - dayVal;
          let base = Boolean(inputDate)
            ? inputDate.getTime()
            : nowDate.getTime();

          let newDate = new Date(base + diff * DAY_MILLISECONDS);
          setDayVal(newValue);
          setInputDate(newDate);
        }}
      />
      <button
        className="text-orange-500 border border-orange-500 rounded-lg mx-5 p-2"
        onClick={(_) => {
          setInputDate(null);
          setDayVal(initialDayVal);
          setTimeVal(initialTimeVal);
        }}
      >
        Back to Now
      </button>
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
                  d={geoPath(getProjection(totalRotation)())(currentNightPath)}
                />
              </clipPath>
              <clipPath id="antarcticaClip">
                <circle r={centerX - 0} cx={centerX} cy={centerY} />
              </clipPath>
            </defs>
            <g clipPath="url(#antarcticaClip)">
              {mapSvg(dayColors)}
              <g clipPath="url(#nightClip)">{mapSvg(nightColors)}</g>
            </g>
          </svg>
        </div>

        <div className="absolute top-0 left-0 font-mono">
          <svg width={width + paddingX} height={height + paddingY}>
            <g>{dateline(pickedDate)}</g>
            <g>
              {cities.map(({ lat: cityLat, lng: cityLon, city, timezone }) => {
                let [x, y] = getProjection(totalRotation)()([cityLon, cityLat]);
                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let pointDiameter = 6;
                let pointRadius = pointDiameter / 2;

                let color = dayTimezoneParity(pickedDate, timezone)
                  ? isNight
                    ? weekdayColors.day2 // "#fff"
                    : weekdayColors.day2
                  : isNight
                  ? weekdayColors.day1 //"#000"
                  : weekdayColors.day1;

                return (
                  <g transform={`translate(${paddingX / 2}, ${paddingY / 2})`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={pointRadius}
                      stroke={"black"}
                      strokeWidth={1}
                      fill={color}
                    />
                  </g>
                );
              })}
              {cities.map(({ lat: cityLat, lng: cityLon, city, timezone }) => {
                let cityAngle = -(totalRotation + cityLon) + 90;
                let x = centerX + 30;
                let y = 0;
                let flipLabel =
                  (cityAngle >= 90 && cityAngle < 270) ||
                  (cityAngle > -270 && cityAngle <= -90);

                let cityAngleRads = ((2 * cityAngle) / 180) * Math.PI;

                let additionalDist = crest(cityAngleRads) * 50;

                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let color = dayTimezoneParity(pickedDate, timezone)
                  ? weekdayColors.day2
                  : weekdayColors.day1;

                let [lineX, lineY] = rotatePoint(
                  0,
                  20,
                  (flipLabel ? -cityAngle + 180 : -cityAngle) - 90
                );

                return (
                  <g
                    transform={`translate(${centerX + paddingX / 2}, ${
                      centerY + paddingY / 2
                    })`}
                  >
                    <path
                      d={`M ${x}, 0 l ${
                        40 + additionalDist
                      }, 0 l ${lineX} ${lineY}`}
                      transform={`rotate(${cityAngle}, 0,0)`}
                      style={{
                        fill: "none",
                        stroke: color,
                        strokeWidth: "2px",
                      }}
                    />
                    <g
                      transform={
                        `rotate(${cityAngle}, 0, 0) translate(${
                          x + 40 + additionalDist
                        }, ${y}) 
                      rotate(${
                        flipLabel ? -cityAngle + 180 : -cityAngle
                      }, 0,0) ` +
                        "translate(30, 0) " +
                        (flipLabel ? "rotate(180, 0, 0) " : " ") +
                        (flipLabel ? "translate(0, 3)" : "translate(0, 3)")
                      }
                    >
                      <Timezone
                        time={pickedDate}
                        flipLabel={flipLabel}
                        city={city}
                        timezone={timezone}
                        color={color}
                      />
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
