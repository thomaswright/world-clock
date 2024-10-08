import { CustomProjection, Graticule } from "@visx/geo";
import { useEffect, useState, useRef, memo } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import * as topojson from "topojson-client";
import topology from "./world-topo.json";
import { geoAzimuthalEqualArea, geoCircle, geoPath, geoContains } from "d3";
const world = topojson.feature(topology, topology.objects.units);
import * as solar from "solar-calculator";
import Slider from "./Slider";
import CitiesDialog, { makeKey } from "./CitiesDialog";

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

const width = 300;
let paddingX = 400;
let paddingY = 320;

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
const centerX = width / 2;
const centerY = height / 2;

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
    // dayPeriod: "short",
    hour12: false,
  });
}

function getDateRotation(time) {
  let summerSolstice = 173;
  const yearStart = new Date(time.getFullYear(), 0, 1);
  const diff = time - yearStart;
  let dayPercent = diff / DAY_MILLISECONDS;
  let dayOffset = dayPercent - summerSolstice;
  return (dayOffset / 365.2422) * 360;
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

function crest(x) {
  return (1 - Math.sqrt((1 + Math.cos(x)) / 2)) ** 2;
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

  let displayTime = getTimeStringInTimezone(new Date(now), timezone);

  let text = city + " " + displayTime;

  return (
    <g>
      <text
        transform={"translate(0, -9)"}
        textAnchor={flipLabel ? "end" : "start"}
        fill={color}
      >
        {city}
      </text>
      <text
        className="font-mono"
        transform={"translate(0, 9)"}
        textAnchor={flipLabel ? "end" : "start"}
        fill={color}
      >
        {displayTime}
      </text>
    </g>
  );
};

let isFirefox = navigator.userAgent.includes("Firefox");

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

  let tr = r + (isFirefox ? 8 : 12);

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
          alignmentBaseline="middle"
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

function getMoonAngle(time) {
  const synodicMonth = 29.53058867;
  const newMoon = new Date("2000-01-06T18:14:00Z");
  const diff = (time.getTime() - newMoon.getTime()) / DAY_MILLISECONDS;
  const phase = (diff % synodicMonth) / synodicMonth;
  const moonAngle = phase * 360;
  return moonAngle;
}

function getMoonPhaseName(angle) {
  let phase = angle / 360;
  if (phase < 0.03 || phase > 0.97) {
    return "New Moon";
  } else if (phase < 0.25) {
    return "Waxing Crescent";
  } else if (phase < 0.27) {
    return "First Quarter";
  } else if (phase < 0.47) {
    return "Waxing Gibbous";
  } else if (phase < 0.53) {
    return "Full Moon";
  } else if (phase < 0.75) {
    return "Waning Gibbous";
  } else if (phase < 0.77) {
    return "Last Quarter";
  } else {
    return "Waning Crescent";
  }
}

function rotatePoint(x, y, angle) {
  // Convert the angle from degrees to radians (if necessary)
  const radians = (angle * Math.PI) / 180;

  const cosTheta = Math.cos(radians); // angle in radians
  const sinTheta = Math.sin(radians);

  const xNew = x * cosTheta - y * sinTheta;
  const yNew = x * sinTheta + y * cosTheta;

  return [xNew, yNew];
}

function getDateDiff(date1, date2) {
  // Get the absolute difference in milliseconds
  let diffInMs = Math.abs(date2 - date1);

  // Calculate the total days, hours, and minutes
  let days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  diffInMs -= days * (1000 * 60 * 60 * 24);

  let hours = Math.floor(diffInMs / (1000 * 60 * 60));
  diffInMs -= hours * (1000 * 60 * 60);

  let minutes = Math.floor(diffInMs / (1000 * 60));

  let neg = date2 < date1 && minutes !== 0;

  return `${neg ? "-" : "+"}${days}d ${String(hours).padStart(
    2,
    "0"
  )}h ${String(minutes).padStart(2, "0")}m`;
}

const StarSVG = ({ width, height }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 200 200">
      <g
        transform="matrix(1,0,0,1,-200.381,-195.367) matrix(0.755146,0,0,0.755146,-57.9159,-27.9865)"
        fill={"var(--model-sun)"}
      >
        <path
          d="M474.474,302.332L506.279,368.713L578.008,352.192L545.939,418.446L603.579,
            464.224L531.785,480.461L531.931,554.068L474.474,508.06L417.017,554.068L417.163,
            480.461L345.37,464.224L403.009,418.446L370.94,352.192L442.669,368.713L474.474,302.332Z"
        />
      </g>
    </svg>
  );
};

const MoonPhase = ({ moonPhaseAngle }) => {
  let phase = moonPhaseAngle / 360;
  let theta = Math.PI * phase * 2;
  let minorAxis = 50 * Math.abs(Math.cos(theta));
  let [sweepFlag1, sweepFlag2] =
    phase < 0.25
      ? [1, 0]
      : phase < 0.5
      ? [0, 0]
      : phase < 0.75
      ? [1, 1]
      : [0, 1];

  return (
    <svg viewBox={`0 0 120 120`}>
      <circle cx={60} cy={60} r={50} fill={"var(--moon-gray)"} />
      <path
        d={`M 60 10 A ${minorAxis} 50 0 0 ${sweepFlag1} 60 110 A 1 1 0 0 ${sweepFlag2} 60 10`}
        fill="var(--moon-white) "
      />
    </svg>
  );
};

const DayProjection = memo(
  () => (
    <CustomProjection data={world.features} projection={getProjection(0)}>
      {(projection) => {
        return (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={centerX - 1}
              fill={"var(--day-sea)"}
            />

            <Graticule
              graticule={(g) => projection.path(g) || ""}
              stroke={"var(--day-graticule)"}
            />

            {projection.features.map(({ feature, path }, i) => (
              <path
                key={`map-feature-${i}`}
                d={path || ""}
                fill={"var(--day-land)"}
                stroke={"var(--day-border)"}
                strokeWidth={0.5}
              />
            ))}
          </g>
        );
      }}
    </CustomProjection>
  ),
  () => true
);

const NightProjection = memo(
  () => (
    <CustomProjection data={world.features} projection={getProjection(0)}>
      {(projection) => {
        return (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={centerX - 1}
              fill={"var(--night-sea)"}
            />

            <Graticule
              graticule={(g) => projection.path(g) || ""}
              stroke={"var(--night-graticule)"}
            />

            {projection.features.map(({ feature, path }, i) => (
              <path
                key={`map-feature-${i}`}
                d={path || ""}
                fill={"var(--night-land)"}
                stroke={"var(--night-border)"}
                strokeWidth={0.5}
              />
            ))}
          </g>
        );
      }}
    </CustomProjection>
  ),
  () => true
);

const Main = () => {
  let now = new Date();
  // let test = new Date(now.getTime() + DAY_MILLISECONDS * 120);

  let [cities, setCities] = useLocalStorage("cities", initialCities);

  let [inputDate, setInputDate] = useState(null);
  let initialTimeVal = timeValWidth / 2;
  let [timeVal, setTimeVal] = useState(timeValWidth / 2);
  let initialDayVal = dayValWidth / 2;
  let [dayVal, setDayVal] = useState(initialDayVal);

  let [nowDate, setNowDate] = useState(new Date());
  let isDragging = useRef(false);
  let dragAngle = useRef(null);
  let dragEl = useRef(null);

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

  let moonAngle = getMoonAngle(pickedDate);
  // Todo: fix dateRotation, sunAngle discrepancy

  let moonPhaseAngle = (moonAngle - dateRotation + 90 + 360) % 360;

  let dateline = (time) => {
    let dayEndAngle = -(totalRotation + 90);
    let dayStartAngle = -totalRotation + dayRotation + 90;
    let strokeWidth = 3;
    let beforeNoon = time.getUTCHours() < 12;
    let swap = dayParity(time) === beforeNoon;
    let color1 = swap ? "var(--weekday1)" : "var(--weekday2)";
    let color2 = swap ? "var(--weekday2)" : "var(--weekday1)";
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

  let drag = (event) => {
    if (!isDragging.current) return;
    event.preventDefault();
    let clientX, clientY;

    if (event.touches) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    const svgRect = dragEl.current.getBoundingClientRect();
    let dragCenterX = (svgRect.right - svgRect.left) / 2;
    let dragCenterY = (svgRect.bottom - svgRect.top) / 2;

    const x = clientX - dragCenterX - svgRect.left;
    const y = clientY - dragCenterY - svgRect.top;

    const angle = Math.atan2(y, x);

    if (Boolean(dragAngle.current)) {
      let angleDiff = angle - dragAngle.current;
      if (angleDiff > 0.75 * 2 * Math.PI) {
        angleDiff = angleDiff - 2 * Math.PI;
      } else if (angleDiff < -0.75 * 2 * Math.PI) {
        angleDiff = angleDiff + 2 * Math.PI;
      }

      dragAngle.current = angle;

      let anglePercent = angleDiff / (2 * Math.PI);

      setInputDate((v) => {
        let newDate = new Date(
          (Boolean(v) ? v.getTime() : now.getTime()) -
            anglePercent * DAY_MILLISECONDS
        );

        return newDate;
      });
    } else {
      dragAngle.current = angle;
    }
  };

  return (
    <div className="font-bold flex flex-col min-h-dvh">
      <div className="w-full flex flex-col items-center px-6 pt-2 sm:-mb-6">
        <div className="w-full max-w-xl">
          <div className=" flex flex-row justify-between items-center w-full ">
            <div className="font-bold tracking-tight text-white text-2xl ">
              World Clock
            </div>
            <CitiesDialog
              addedCities={cities}
              addCity={(newCity) => {
                setCities((v) => [
                  ...v.filter((match) => !(makeKey(match) == makeKey(newCity))),
                  newCity,
                ]);
              }}
              removeCity={(newCity) => {
                setCities((v) =>
                  v.filter((match) => !(makeKey(match) == makeKey(newCity)))
                );
              }}
            />
          </div>
          <div className="relative w-full">
            <div id={"model"} className="w-16 h-16 absolute ">
              <svg viewBox={`0 0 120 120`}>
                <g transform="translate(60, 60)">
                  <circle
                    stroke={"var(--model-orbit)"}
                    strokeWidth={2}
                    r={40}
                    cx={0}
                    cy={0}
                  />
                  <g transform="translate(-16, -16)">
                    <StarSVG width={32} height={32} />
                  </g>
                  {/* <rect
                      transform="translate(-8, -8)"
                      fill={"yellow"}
                      width={16}
                      height={16}
                      x={0}
                      y={0}
                    />
                    <rect
                      transform="rotate(45) translate(-8, -8) "
                      fill={"#FFC400"}
                      width={16}
                      height={16}
                      x={0}
                      y={0}
                    /> */}

                  <g
                    transform={` rotate(${
                      -dateRotation - 90
                    }) translate(40, 0)`}
                  >
                    <circle
                      fill={"var(--model-earth-gray)"}
                      r={8}
                      cx={0}
                      cy={0}
                    />
                    <path
                      d="M 0 -8 A 8 8 0 0 0 0 8"
                      fill="var(--model-earth-white)"
                    />
                    <g
                      transform={`rotate(${
                        -moonAngle + dateRotation
                      }) translate(0, 16)`}
                    >
                      <circle fill={"var(--model-moon)"} r={3} cx={0} cy={0} />
                    </g>
                    {/* 
                      <g transform={`translate(0, 20) rotate(${-moonAngle}) `}>
                        <circle
                          cx={0}
                          cy={0}
                          r={4}
                          fill={"oklch(0.56 0.06 199.91)"}
                        />
                        <g
                          transform={`rotate(${moonAngle - dateRotation + 90})`}
                        >
                          <path d="M 0 -4 A 4 4 0 0 1 0 4" fill="white " />
                        </g>
                      </g> */}
                  </g>
                </g>
              </svg>
            </div>
            <div id={"moonPhase"} className="w-12 h-12 absolute right-0 ">
              <MoonPhase moonPhaseAngle={moonPhaseAngle} />

              <div className="text-white text-xs font-thin w-full text-center">
                {getMoonPhaseName(moonPhaseAngle)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-row justify-center items-center flex-1 ">
        <div
          ref={dragEl}
          className="overflow-x-scroll w-full max-w-[760px]"
          onMouseDown={(_) => {
            isDragging.current = true;
            dragAngle.current = null;
          }}
          onMouseUp={(_) => {
            isDragging.current = false;
            dragAngle.current = null;
          }}
          onTouchStart={(_) => {
            isDragging.current = true;
            dragAngle.current = null;
          }}
          onTouchEnd={(_) => {
            isDragging.current = false;
            dragAngle.current = null;
          }}
          onMouseMove={drag}
          onTouchMove={drag}
        >
          <svg
            className=""
            viewBox={`0 0 ${width + paddingX} ${height + paddingY}`}
            width={"100%"}
            height={"100%"}
          >
            <defs>
              <clipPath id="nightClip">
                <path d={geoPath(getProjection()())(currentNightPath)} />
              </clipPath>
              <clipPath id="antarcticaClip">
                <circle r={centerX - 0} cx={centerX} cy={centerY} />
              </clipPath>
            </defs>

            <g
              transform={`translate(${paddingX / 2 + centerX}, ${
                paddingY / 2 + centerY
              }) rotate(${-totalRotation}) translate(${-centerX}, ${-centerY})`}
              clipPath="url(#antarcticaClip)"
            >
              <DayProjection />
              <g clipPath="url(#nightClip)">
                <NightProjection />
              </g>
            </g>
            <g>{dateline(pickedDate)}</g>

            <g>
              {cities.map((cityData) => {
                let {
                  lat: cityLat,
                  lng: cityLon,
                  city,
                  timezone,
                  country,
                } = cityData;
                let [x, y] = getProjection(totalRotation)()([cityLon, cityLat]);
                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let pointDiameter = 6;
                let pointRadius = pointDiameter / 2;

                let color = dayTimezoneParity(pickedDate, timezone)
                  ? isNight
                    ? "var(--weekday2)"
                    : "var(--weekday2)"
                  : isNight
                  ? "var(--weekday1)"
                  : "var(--weekday1)";

                return (
                  <g
                    key={makeKey(cityData)}
                    transform={`translate(${paddingX / 2}, ${paddingY / 2})`}
                  >
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
              {cities.map((cityData) => {
                let {
                  lat: cityLat,
                  lng: cityLon,
                  city,
                  timezone,
                  country,
                } = cityData;
                let cityAngle = -(totalRotation + cityLon) + 90;
                let x = centerX + 30;
                let y = 0;
                let flipLabel =
                  (cityAngle >= 90 && cityAngle < 270) ||
                  (cityAngle > -270 && cityAngle <= -90);

                let cityAngleRads = ((2 * cityAngle) / 180) * Math.PI;

                let additionalDist = crest(cityAngleRads) * 90;

                let isNight = geoContains(currentNightPath, [cityLon, cityLat]);
                let color = dayTimezoneParity(pickedDate, timezone)
                  ? "var(--weekday2)"
                  : "var(--weekday1)";

                let [lineX, lineY] = rotatePoint(
                  0,
                  20,
                  (flipLabel ? -cityAngle + 180 : -cityAngle) - 90
                );

                return (
                  <g
                    key={makeKey(cityData)}
                    transform={`translate(${centerX + paddingX / 2}, ${
                      centerY + paddingY / 2
                    })`}
                  >
                    <path
                      d={`M ${x}, 0 l ${
                        20 + additionalDist
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
                          x + 20 + additionalDist
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

            <g
              key={"moon"}
              transform={`translate(${centerX + paddingX / 2}, ${
                centerY + paddingY / 2
              }) rotate(${-moonAngle}) translate(${width / 2 + 42}, 0) `}
            >
              <circle cx={0} cy={0} r={12} fill={"var(--moon-gray)"} />
              <g transform={`rotate(${moonAngle - dateRotation + 90})`}>
                <path d="M 0 -12 A 12 12 0 0 1 0 12" fill="var(--moon-white)" />
                {/* <text
                  textAnchor="middle"
                  x={0}
                  y={-12 - 4}
                  fill="white"
                  className="text-xs"
                >
                  {getMoonPhaseName(moonAngle)}
                </text> */}
              </g>
              <rect
                x={0}
                y={-12}
                height={24}
                width={1}
                rx={2}
                fill={"var(--moon-line)"}
              />
            </g>
          </svg>
        </div>
      </div>
      <div className="w-full flex flex-col items-center px-6 pb-2 ">
        <div className="w-full max-w-xl">
          <div className=" flex flex-col sm:flex-row justify-between items-center w-full">
            <input
              className="my-2 py-1 rounded "
              style={{
                backgroundColor: "transparent",
                color: "var(--night-land)",
              }}
              type="datetime-local"
              value={new Date(
                pickedDate.getTime() -
                  pickedDate.getTimezoneOffset() * 60 * 1000
              )
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (date instanceof Date && !isNaN(date)) {
                  setInputDate(date);
                }
              }}
            />
            <div className="text-white font-thin font-mono">
              {getDateDiff(now, pickedDate)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="w-full">
              <div className=" flex flex-row justify-between items-center w-full">
                <div className="text-white py-2 font-medium">Adjust Time</div>
              </div>

              <Slider
                classNames={{ form: "w-full", Root: "w-full", Track: "" }}
                styles={{
                  Root: {},
                  Track: {
                    backgroundColor: "var(--night-land)",
                  },
                }}
                min={0}
                max={timeValWidth}
                value={timeVal}
                step={1000 * 60 * 10}
                onChange={(value) => {
                  let newValue = parseInt(value);
                  let diff = newValue - timeVal;
                  let base = Boolean(inputDate)
                    ? inputDate.getTime()
                    : nowDate.getTime();
                  let newDate = new Date(base + diff);
                  setTimeVal(newValue);
                  setInputDate(newDate);
                }}
              />
            </div>
            <div className="w-full">
              <div className=" flex flex-row justify-between items-center w-full">
                <div className="text-white py-2 font-medium">Adjust Day</div>
                {Boolean(inputDate) ? (
                  <button
                    className=" rounded-full py-2 px-4 "
                    style={{
                      color: "var(--night-land)",
                      borderColor: "var(--night-land)",
                    }}
                    onClick={(_) => {
                      setInputDate(null);
                      setDayVal(initialDayVal);
                      setTimeVal(initialTimeVal);
                    }}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              <Slider
                classNames={{ form: "w-full", Root: "w-full", Track: "" }}
                styles={{
                  Root: {},
                  Track: {
                    backgroundColor: "var(--night-land)",
                  },
                }}
                min={0}
                max={dayValWidth}
                value={dayVal}
                step={1}
                onChange={(value) => {
                  let newValue = parseInt(value);
                  let diff = newValue - dayVal;
                  let base = Boolean(inputDate)
                    ? inputDate.getTime()
                    : nowDate.getTime();

                  let newDate = new Date(base + diff * DAY_MILLISECONDS);
                  setDayVal(newValue);
                  setInputDate(newDate);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="text-white text-xs text-center p-6 py-3 ">
        {"By "}
        <a
          className="font-medium text-[var(--credit)]"
          href={"https://github.com/thomaswright/world-clock"}
        >
          {"Thomas Wright"}
        </a>
      </div>
    </div>
  );
};

export default Main;
