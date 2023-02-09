/// app.js
import React from "react";
import DeckGL from "@deck.gl/react";

import { OrthographicView } from "@deck.gl/core";
import { MultiscaleImageLayer } from "@vivjs/layers";

import { loadOmeroMultiscales, open, getNgffAxes, fitBounds } from "./util";

// DeckGL react component
export default function App() {
  let config = {
    source:
      "https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0048A/9846152.zarr/",
  };

  const [layers, setLayers] = React.useState([]);

  const [viewState, setViewState] = React.useState({
    target: [0, 0, 0],
    rotationX: 0,
    zoom: 1,
  });

  const deckRef = React.useRef(null);

  const onViewStateChange = React.useCallback(({ viewState }) => {
    // Save the view state and trigger rerender
    setViewState(viewState);
  }, []);

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

      const { deck } = deckRef.current;
      let targetWidth = deck.width;
      let targetHeight = deck.height;
      let padding = 0;
      // zoom: 0 maps one unit distance to one pixel on screen, and increasing zoom
      // by 1 scales the same object to twice as large
      // limit initial zoom to 100%
      let maxZoom = 0;

      let bounds = fitBounds(
        [width, height],
        [targetWidth, targetHeight],
        maxZoom,
        padding
      );

      setViewState(bounds);

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

      setLayers([new MultiscaleImageLayer(layerData)]);
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
      <DeckGL
        ref={deckRef}
        onViewStateChange={onViewStateChange}
        controller={true}
        viewState={viewState}
        views={[new OrthographicView({ id: "ortho", controller: true })]}
        layers={layers}
      />
    </div>
  );
}
