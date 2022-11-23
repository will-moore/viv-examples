
import { ContainsArrayError, HTTPStore, openArray, openGroup, ZarrArray } from 'zarr';

import { ZarrPixelSource } from '@vivjs/loaders';

async function normalizeStore(source) {
    let path;
    if (typeof source === 'string') {
      let store;
  
      // if (source.endsWith('.json')) {
      //   // import custom store implementation
      //   const [{ ReferenceStore }, json] = await Promise.all([
      //     import('reference-spec-reader'),
      //     fetch(source).then((res) => res.json()),
      //   ]);
  
      //   store = ReferenceStore.fromJSON(json);
      // } else {
        const url = new URL(source);
        store = new HTTPStore(url.origin);
        path = url.pathname.slice(1);
      // }
  
      // Wrap remote stores in a cache
      // return { store: new LRUCacheStore(store), path };
      return { store, path };
    }
  
    return { store: source, path };
  }
  
  export async function open(source) {
    const { store, path } = await normalizeStore(source);
    return openGroup(store, path).catch((err) => {
      if (err instanceof ContainsArrayError) {
        return openArray({ store });
      }
      throw err;
    });
  }
  
  async function loadMultiscales(grp, multiscales) {
    const { datasets } = multiscales[0] || [{ path: '0' }];
    const nodes = await Promise.all(datasets.map(({ path }) => grp.getItem(path)));
    if (nodes.every((node) => node instanceof ZarrArray)) {
      return nodes;
    }
    throw Error('Multiscales metadata included a path to a group.');
  }
  
  function getNgffAxes(multiscales) {
    // Returns axes in the latest v0.4+ format.
    // defaults for v0.1 & v0.2
    const default_axes = [
      { type: 'time', name: 't' },
      { type: 'channel', name: 'c' },
      { type: 'space', name: 'z' },
      { type: 'space', name: 'y' },
      { type: 'space', name: 'x' },
    ];
    function getDefaultType(name) {
      if (name === 't') return 'time';
      if (name === 'c') return 'channel';
      return 'space';
    }
    let axes = default_axes;
    // v0.3 & v0.4+
    if (multiscales[0].axes) {
      axes = multiscales[0].axes.map((axis) => {
        // axis may be string 'x' (v0.3) or object
        if (typeof axis === 'string') {
          return { name: axis, type: getDefaultType(axis) };
        }
        const { name, type } = axis;
        return { name, type: type ?? getDefaultType(name) };
      });
    }
    return axes;
  }
  
  function getNgffAxisLabels(axes) {
    return axes.map((axis) => axis.name);
  }
  
  export function isInterleaved(shape) {
    const lastDimSize = shape[shape.length - 1];
    return lastDimSize === 3 || lastDimSize === 4;
  }
  
  export function guessTileSize(arr) {
    const interleaved = isInterleaved(arr.shape);
    const [ySize, xSize] = arr.chunks.slice(interleaved ? -3 : -2);
    const size = Math.min(ySize, xSize);
    // Needs to be a power of 2 for deck.gl
    return 2 ** Math.floor(Math.log2(size));
  }
  
  function parseOmeroMeta({ rdefs, channels, name }, axes) {
    const t = rdefs.defaultT ?? 0;
    const z = rdefs.defaultZ ?? 0;
  
    const colors = [];
    const contrast_limits = [];
    const visibilities = [];
    const names = [];
  
    channels.forEach((c, index) => {
      colors.push(c.color);
      contrast_limits.push([c.window.start, c.window.end]);
      visibilities.push(c.active);
      names.push(c.label || '' + index);
    });
  
    const defaultSelection = axes.map((axis) => {
      if (axis.type == 'time') return t;
      if (axis.name == 'z') return z;
      return 0;
    });
    const channel_axis = axes.findIndex((axis) => axis.type === 'channel');
  
    return {
      name,
      names,
      colors,
      contrast_limits,
      visibilities,
      channel_axis,
      defaultSelection,
    };
  }
  
  export async function loadOmeroMultiscales (config, zarrGroup, attrs) {
    const { name, opacity = 1, colormap = '' } = config;
    const data = await loadMultiscales(zarrGroup, attrs.multiscales);
    const axes = getNgffAxes(attrs.multiscales);
    const axis_labels = getNgffAxisLabels(axes);
    const meta = parseOmeroMeta(attrs.omero, axes);
    const tileSize = guessTileSize(data[0]);
  
    const loader = data.map((arr) => new ZarrPixelSource(arr, axis_labels, tileSize));
    return {
      loader: loader,
      axis_labels,
      // model_matrix: parseMatrix(config.model_matrix),
      defaults: {
        selection: meta.defaultSelection,
        colormap,
        opacity,
      },
      ...meta,
      name: meta.name ?? name,
    };
  }