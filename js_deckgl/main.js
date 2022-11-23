import {Deck, OrthographicView} from '@deck.gl/core';
import { MultiscaleImageLayer } from '@vivjs/layers';

import {loadOmeroMultiscales, open} from "./util";

let config = {
  source:"https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr"
}

const node = await open(config.source);

const attrs = await node.attrs.asObject();
console.log('attrs', attrs);
let layerData = await loadOmeroMultiscales(config, node, attrs);
console.log("layerData", layerData);


const INITIAL_VIEW_STATE = {
  zoom: -1,
  bearing: 0,
};

const layer = new MultiscaleImageLayer(layerData);

export const deck = new Deck({
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
  layers: [ layer ],
  views: [new OrthographicView({ id: 'ortho', controller: true })]
});

// For automated test cases
/* global document */
document.body.style.margin = '0px';
document.body.style.background = "black"
