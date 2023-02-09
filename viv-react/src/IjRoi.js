// This script decodes and displays an ImageJ .roi
// file. It is intended to be an example that shows
// how other programs can open an ImageJ ROI. The
// constants (TYPE, TOP, etc.) are from
// https://imagej.nih.gov/ij/source/ij/io/RoiDecoder.java
// Requires ImageJ 1.52r or later, which adds the
// IJ.openAsByteBuffer() method.

const TYPE = 6;
const TOP = 8;
const LEFT = 10;
const BOTTOM = 12;
const RIGHT = 14;
const N_COORDINATES = 16;
const X1 = 18;
const Y1 = 22;
const X2 = 26;
const Y2 = 30;
const COORDINATES = 64;
const polygon = 0;
const rect = 1;
const oval = 2;
const line = 3;
const freeline = 4;
const polyline = 5;
const noRoi = 6;
const freehand = 7;
const traced = 8;
const angle = 9;
const point = 10;
// bb = IJ.openAsByteBuffer("");

export function bytesToRoi(abuffer) {
  console.log("abuffer", abuffer.length);
  // let int16array = new Int16Array(abuffer);
  // let int8array = new Int8Array(abuffer);
  // let uint8array = new Uint8Array(abuffer);

  // console.log('int16array',int16array)
  // console.log('int8array', int8array)
  // console.log('uint8array',uint8array)


  let bb = new Int16Array(abuffer);
  console.log("bb", bb);
  console.log("bb", bb[0]);
  if (bb.getInt(0) != 1232041332) IJ.error("This is not an ImageJ ROI");
  let type = bb.get(TYPE);
  xbase = bb.getShort(LEFT);
  ybase = bb.getShort(TOP);
  roi = null;
  if (type == rect || type == oval) {
    bottom = bb.getShort(BOTTOM);
    right = bb.getShort(RIGHT);
    width = right - xbase;
    height = bottom - ybase;
    if (type == oval) roi = new OvalRoi(xbase, ybase, width, height);
    else roi = new Roi(xbase, ybase, width, height);
  } else if (type == line) {
    x1 = bb.getFloat(X1);
    y1 = bb.getFloat(Y1);
    x2 = bb.getFloat(X2);
    y2 = bb.getFloat(Y2);
    roi = new Line(x1, y1, x2, y2);
  } else {
    roiType = Roi.POLYGON;
    switch (type) {
      case freehand:
        roiType = Roi.FREEROI;
        break;
      case traced:
        roiType = Roi.TRACED_ROI;
        break;
      case polyline:
        roiType = Roi.POLYLINE;
        break;
      case freeline:
        roiType = Roi.FREELINE;
        break;
    }
    n = bb.getShort(N_COORDINATES);
    polygon = new Polygon();
    for (i = 0; i < n; i++) {
      x = xbase + bb.getShort(COORDINATES + i * 2);
      y = ybase + bb.getShort(COORDINATES + 2 * n + i * 2);
      polygon.addPoint(x, y);
    }
    roi = new PolygonRoi(polygon, roiType);
  }

  return roi;
}
// img = IJ.createImage("tmp","8-bit black",500,500,1);
// img.setRoi(roi);
// img.show();
