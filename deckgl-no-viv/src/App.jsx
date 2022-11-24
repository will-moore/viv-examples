
// based on example at https://deck.gl/examples/tile-layer-non-geospatial/
// https://github.com/visgl/deck.gl/blob/a0aa5a5d82d7b7c79dd0e45bd0e8daf6842ac19a/examples/website/image-tile/app.js

/* global fetch, DOMParser */
import React, {useState, useEffect} from 'react';

import DeckGL, {OrthographicView, COORDINATE_SYSTEM} from 'deck.gl';
import {TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {clamp} from '@math.gl/core';

import {openArray} from "zarr";
import {loadRegion, renderTo8bitArray, randomLut} from "./util";

const source = "https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr/labels/0";

function getTooltip({tile, bitmap}) {
  if (tile && bitmap) {
    const {x, y, z} = tile.index;
    return `\
    tile: x: ${x}, y: ${y}, z: ${z}
    (${bitmap.pixel[0]},${bitmap.pixel[1]}) in ${bitmap.size.width}x${bitmap.size.height}`;
  }
  return null;
}

async function loadTile({bbox}) {
  let {top, left, right, bottom} = bbox;
  // get dataset index from x
  let datasetIndex = 0;
  const store = await openArray({store: source + `/${datasetIndex}`});
  // get shape etc.
  // [1,1,1,"0:100", "0:100"]
  let zIndex = 100;
  const plane = await loadRegion(store, [0, zIndex, `${top}:${bottom}`, `${left}:${right}`]);
  let width = plane.shape[1];
  let height = plane.shape[0];
  
  const rgb = renderTo8bitArray([plane], [randomLut], [[0, 50]]);
  return new ImageData(rgb, width, height);
}

export default function App({autoHighlight = true, onTilesLoad}) {
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    const getMetaData = async () => {
      const zattrs = await fetch(source + "/.zattrs").then(rsp => rsp.json());
      console.log('zattrs', zattrs);
      // assume a single multiscales
      const datasets = zattrs.multiscales[0].datasets;
      const stores = await Promise.all(datasets.map(async d => openArray({ store: source + "/" + d.path })));
      const shape = stores[0].shape;
      console.log('shape', shape);

      setDimensions({
        height: shape[shape.length - 2],
        width: shape[shape.length - 1],
        tileSize: 100
      });
    };
    getMetaData();
  }, []);

  let initialViewState = {
    target: [0, 0, 0],
    zoom: 0
  };

  if (dimensions) {
    initialViewState.target = [dimensions.width / 2, dimensions.height/ 2, 0]
  }

  const tileLayer =
    dimensions &&
    new TileLayer({
      pickable: autoHighlight,
      tileSize: dimensions.tileSize,
      autoHighlight,
      highlightColor: [60, 60, 60, 100],
      minZoom: 0,
      maxZoom: 0,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      extent: [0, 0, dimensions.width, dimensions.height],
      getTileData: loadTile,
      onViewportLoad: onTilesLoad,

      renderSubLayers: props => {
        const {
          bbox: {left, bottom, right, top}
        } = props.tile;
        const {width, height} = dimensions;
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [
            clamp(left, 0, width),
            clamp(bottom, 0, height),
            clamp(right, 0, width),
            clamp(top, 0, height)
          ]
        });
      }
    });


  return (
    <DeckGL
      views={[new OrthographicView({id: 'ortho'})]}
      layers={[tileLayer]}
      initialViewState={initialViewState}
      controller={true}
      getTooltip={getTooltip}
    />
  );
}
