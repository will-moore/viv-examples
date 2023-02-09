
import React from "react";
import DeckGL from "@deck.gl/react";

import { OrthographicView } from "@deck.gl/core";
import { MultiscaleImageLayer } from "@vivjs/layers";

import { fitBounds } from "./util";

// DeckGL react component
export default function Viewer({layersData}) {

  let layers = layersData.map(ld => new MultiscaleImageLayer(ld));

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

    if (!layersData || layersData.length == 0) {
      return;
    }

    let shape = layersData[0].loader[0]._data.meta.shape;
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

  }, [layersData]);

  return (
      <DeckGL
        ref={deckRef}
        onViewStateChange={onViewStateChange}
        controller={true}
        viewState={viewState}
        views={[new OrthographicView({ id: "ortho", controller: true })]}
        layers={layers}
      />
  );
}
