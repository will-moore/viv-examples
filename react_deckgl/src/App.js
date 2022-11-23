import React from 'react';
import './App.css';
import { openArray, HTTPStore } from 'zarr';
import { ImageLayer, ZarrLoader } from '@hms-dbmi/viv';
import DeckGL from 'deck.gl'
import { OrthographicView } from '@deck.gl/core'

function App() {

  const vpWidth = 800;
  const vpHeight = 500;

  const [layers, setLayers] = React.useState([]);
  // pan top-left of image to top-left of viewport. 0, 0 puts top-left of image to centre
  // zoom of -1 is 50%
  const [viewState, setViewState] = React.useState({ target: [vpWidth/2, vpHeight/2, 0], zoom: 0 });

  React.useEffect(() => {

    const fn = async function() {

      let url = 'https://minio-dev.openmicroscopy.org/idr/idr0002-heriche-condensation/plate1_1_013/422_no_T/422.zarr/0/F/1/Field_1/';
      const data = await openArray({ store: new HTTPStore(url), path: '0' });
      // const { chunks, shape } = data;
      const dimensions = [0, 1, 2, 'y', 'x'].map((field) => ({ field }));
      const loader = new ZarrLoader({ data, dimensions });

      const layerProps = {
        id: 'abc123',
        loader,  // ZarrLoader
        // source,
        loaderSelection: [[0, 0, 0, 0, 0], [0, 1, 0, 0, 0]],
        colorValues: [[255, 0, 0], [0, 255, 0]],
        sliderValues: [[174, 1692], [345, 3480]],
        // contrastLimits: [[174, 1692], [345, 3480]],
        channelIsOn: [true, true],
        // opacity,
        // colormap
      }
      setLayers([new ImageLayer(layerProps)]);
    }

    fn();

  }, []);

  console.log('viewState', viewState.target, viewState.zoom);

  return (
    <div className="App">
      Image:
      <div style={{ marginLeft: 'auto', marginRight: 'auto', postion: 'relative', width: 800, height: 500, border: 'solid #bbb 1px'}}>
        <DeckGL
          layers={layers}
          viewState={viewState}
          views={new OrthographicView({ controller: true, id: 'ortho' })}
          width={800}
          height={500}
          style={{ position: 'relative', background: '#333'}}
          onViewStateChange={(e) => setViewState(e.viewState)}
        />
      </div>
    </div>
  );
}

export default App;
