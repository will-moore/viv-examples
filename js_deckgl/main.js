import { Deck, OrthographicView } from "@deck.gl/core";
import { MultiscaleImageLayer } from "@vivjs/layers";

import { loadOmeroMultiscales, open, getNgffAxes } from "./util";

let config = {
  source: "https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr",
};

const node = await open(config.source);

const attrs = await node.attrs.asObject();
console.log("attrs", attrs);
const axes = getNgffAxes(attrs.multiscales);
let layerData = await loadOmeroMultiscales(config, node, attrs);
// Use first array to get width/height
console.log(layerData);

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

const INITIAL_VIEW_STATE = {
  zoom: 0,
  bearing: 0,
  target: [width / 2, height / 2, 0],
};

const layer = new MultiscaleImageLayer(layerData);

export const deck = new Deck({
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
  layers: [layer],
  views: [new OrthographicView({ id: "ortho", controller: true })],
});

// For automated test cases
/* global document */
document.body.style.margin = "0px";
document.body.style.background = "black";
