module Map = {
  @module("./other.jsx") @react.component
  external make: unit => React.element = "default"
}

@react.component
let make = () => {
  <div>
    <Map />
  </div>
}
