/// app.js
import React from "react";

import Viewer from "./Viewer";
import { loadOmeroMultiscales, open, getNgffAxes, fitBounds } from "./util";

// DeckGL react component
export default function App() {
  let config = {
    source:
      "https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0048A/9846152.zarr/",
  };

  const [layers, setLayers] = React.useState([]);

  React.useEffect(() => {
    const fn = async function () {
      const node = await open(config.source);

      const attrs = await node.attrs.asObject();
      console.log("attrs", attrs);
      const axes = getNgffAxes(attrs.multiscales);

      let layerData = await loadOmeroMultiscales(config, node, attrs);
      console.log("layerData", layerData);

      let shape = layerData.loader[0]._data.meta.shape;
      const [height, width] = shape.slice(-2);

      let selections = [];
      layerData.channelsVisible.forEach((visible, chIndex) => {
        if (visible) {
          selections.push(
            axes.map((axis, dim) => {
              if (axis.type == "time") return 0;
              if (axis.name == "z") return parseInt(shape[dim] / 2);
              if (axis.name == "c") return chIndex;
              return 0;
            })
          );
        }
      });
      console.log("selections", selections);

      layerData.selections = selections;

      setLayers([layerData]);
    };

    fn();
  }, []);

  let wrapperStyle = {
    width: 500,
    height: 300,
    border: "solid red 1px",
    position: "relative",
    marginLeft: 100,
  };

  return (
    <div style={wrapperStyle}>
      <Viewer layersData={layers} />
    </div>
  );
}
