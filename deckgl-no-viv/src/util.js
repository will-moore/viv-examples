
import { slice } from "zarr";

export async function loadRegion(store, region) {
  // E.g. region = [1,1,1,"0:100", "0:100"]
  region = region.map((dim) => {
    if (typeof dim === "string") {
      let startStop = dim.split(":").map((d) => parseInt(d));
      return startStop.length === 2 ? slice(...startStop) : startStop[0];
    }
    return dim;
  });
  let zarray = await store.get(region);
  return zarray;
}

export function range(length) {
  return Array.from({ length }, (_, i) => i);
}

export const redLut = Array.from({ length: 256 }, (_, i) => [i, 0, 0]);
export const randomLut = Array.from({ length: 256 }, (_, i) => {
  if (i === 0) {
    return [0, 0, 0]
  }
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  return [red, green, blue]
});

export function renderTo8bitArray(planes, channelLuts, channelRanges) {
  // planes is list of zarr arrays
  // channelLuts is list of luts. lut is a list of 256 * (r,g,b)
  // channelRanges is list of (start, end)
  const height = planes[0].shape[0];
  const width = planes[0].shape[1];
  const rgba = new Uint8ClampedArray(4 * height * width).fill(0);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let p = 0; p < planes.length; p++) {
        let data = planes[p].data;
        let lut = channelLuts[p];
        let range = channelRanges[p];
        let rawValue = data[y][x];
        let fraction = (rawValue - range[0]) / (range[1] - range[0]);
        // for red, green, blue,
        for (let i = 0; i < 3; i++) {
          // lut[i] is 0-255...
          let index8bit = (fraction * 255) << 0;
          let v = lut[index8bit][i];
          // increase pixel intensity if value is higher
          rgba[offset + i] = Math.max(rgba[offset + i], v);
        }
      }
      rgba[offset + 3] = 255; // alpha
      offset += 4;
    }
  }
  return rgba;
}
