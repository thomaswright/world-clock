import React from "react";
import * as Slider from "@radix-ui/react-slider";
import "./slider.css";

const SliderDemo = ({
  classNames,
  styles,
  onChange,
  min,
  max,
  value,
  step,
}) => (
  <form>
    <Slider.Root
      className={"SliderRoot" + " " + classNames.Root}
      style={styles.Root}
      onValueChange={(v) => onChange(v[0])}
      min={min}
      max={max}
      value={[value]}
      step={step}
    >
      <Slider.Track
        style={styles.Track}
        className={"SliderTrack" + " " + classNames.Track}
      >
        <Slider.Range className="SliderRange" />
      </Slider.Track>
      <Slider.Thumb className="SliderThumb" aria-label="Volume" />
    </Slider.Root>
  </form>
);

export default SliderDemo;
