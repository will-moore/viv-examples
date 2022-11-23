/// app.js
import React from 'react';
import DeckGL from '@deck.gl/react';

import {OrthographicView} from '@deck.gl/core';
import { MultiscaleImageLayer } from '@vivjs/layers';

import {loadOmeroMultiscales, open} from "./util";


// DeckGL react component
export default function App() {
  let config = {
    source:"https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr"
  }

  const [layers, setLayers] = React.useState([]);
  
  React.useEffect(() => {

    const fn = async function() {

      const node = await open(config.source);
      
      const attrs = await node.attrs.asObject();
      console.log('attrs', attrs);
      let layerData = await loadOmeroMultiscales(config, node, attrs);
      console.log("layerData", layerData);

      setLayers([new MultiscaleImageLayer(layerData)]);
    }

    fn();

  }, []);

  const INITIAL_VIEW_STATE = {
    zoom: -1,
    bearing: 0,
  };

  return <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      views={[new OrthographicView({ id: 'ortho', controller: true })]}
      layers={layers} />;
}
