/// app.js
import React from 'react';
import DeckGL from '@deck.gl/react';

import {OrthographicView} from '@deck.gl/core';
import { MultiscaleImageLayer } from '@vivjs/layers';

import {loadOmeroMultiscales, open, getNgffAxes} from "./util";
import { bytesToRoi } from './IjRoi';


// DeckGL react component
export default function App() {
  let config = {
    source:"https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr"
  }

  const [layers, setLayers] = React.useState([]);
  
  React.useEffect(() => {

    const fn = async function() {

      const roiUrl = "http://localhost:8000/example.roi";
      fetch(roiUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        console.log("buffer", buffer);
        // bytesToRoi(buffer);
        let int16array = new Int16Array(buffer);
        let int8array = new Int8Array(buffer);
        console.log('int16array', int16array);
        console.log('int8array', int8array);
      });

      const node = await open(config.source);
      
      const attrs = await node.attrs.asObject();
      console.log('attrs', attrs);
      const axes = getNgffAxes(attrs.multiscales);

      let layerData = await loadOmeroMultiscales(config, node, attrs);
      console.log("layerData", layerData);

      let shape = layerData.loader[0]._data.meta.shape;
      const width = shape[shape.length - 1];
      const height = shape[shape.length - 2];

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
    }

    fn();

  }, []);

  const INITIAL_VIEW_STATE = {
    zoom: -1,
    bearing: 0,
    target: [500, 500, 0]
  };

  return <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      views={[new OrthographicView({ id: 'ortho', controller: true })]}
      layers={layers} />;
}
