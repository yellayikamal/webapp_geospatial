                      <template>
                          <div class="map-container">
                            <div id="map"></div>
                            <div class="controls">
                              <input
                                type="file"
                                ref="geojsonInput"
                                @change="handleGeoJsonUpload"
                                accept=".geojson"
                                style="display: none;"
                              />
                              <input                               
                                type="file"
                                ref="kmlInput"
                                @change="handleKmlUpload"
                                accept=".kml"
                                style="display: none;"
                              />
                              <input
                                type="file"
                                ref="tiffInput"
                                @change="handleTiffUpload"
                                accept=".tiff,.tif"
                                style="display: none;"
                              />
                              <div class="button-group">
                              <button @click="triggerGeoJsonUpload" class="geojson-btn" >Upload GeoJSON</button>
                              <button @click="triggerKmlUpload" class ="kml-btn" >Upload KML</button>
                              <button @click="triggerTiffUpload" class="tiff-btn" >Upload TIFF</button>
                            </div>
                            </div>
                          </div>
                        </template>

                        <script>
                        import mapboxgl from 'mapbox-gl';
                        import { DOMParser } from 'xmldom';
                        import { kml } from '@tmcw/togeojson';
                        import * as GeoTIFF from 'geotiff';


                        export default {
                          name: 'MapboxMap',
                          data() {
                            return {
                              map: null,
                              mapboxAccessToken: 'pk.eyJ1Ijoia2FtYWx5ZWxsYXlpMTkiLCJhIjoiY20zZTl2Yzk5MDl5ZDJrcjN6aDIxeDZkOSJ9.6J4CPNKKadbo5Afv4zznbA',
                            };
                          },
                          mounted() {
                            this.initializeMap();
                          },
                          methods: {
                            initializeMap() {
                              mapboxgl.accessToken = this.mapboxAccessToken;

                              this.map = new mapboxgl.Map({
                                container: 'map',
                                style: 'mapbox://styles/mapbox/streets-v11',
                                center: [0, 0],
                                zoom: 2,
                              });

                              this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
                            },

                            triggerGeoJsonUpload() {
                              this.$refs.geojsonInput.click();
                            },

                            triggerKmlUpload() {
                              this.$refs.kmlInput.click();
                            },

                            triggerTiffUpload() {
                              this.$refs.tiffInput.click();
                            },

                            handleGeoJsonUpload(event) {
                              const file = event.target.files[0];
                              if (!file) {
                                alert('No file selected.');
                                return;
                              }

                              const reader = new FileReader();
                              reader.onload = (e) => {
                                try {
                                  const geojson = JSON.parse(e.target.result);
                                  this.renderGeoJson(geojson);
                                } catch (error) {
                                  console.error('Invalid GeoJSON file:', error);
                                  alert('Failed to load GeoJSON. Please check the file format.');
                                }
                              };
                              reader.onerror = () => {
                                alert('An error occurred while reading the file.');
                              };
                              reader.readAsText(file);
                            },

                            handleKmlUpload(event) {
                              const file = event.target.files[0];
                              if (!file) return;

                              const reader = new FileReader();
                              reader.onload = (e) => {
                                try {
                                  const kmlContent = new DOMParser().parseFromString(e.target.result, 'text/xml');
                                  const geojson = kml(kmlContent);
                                  this.renderGeoJson(geojson);
                                } catch (error) {
                                  console.error('Invalid KML file:', error);
                                  alert('Failed to load KML. Please check the file format.');
                                }
                              };
                              reader.readAsText(file);
                            },

                            async handleTiffUpload(event) {
                          const file = event.target.files[0];
                          if (!file) {
                            alert('No file selected.');
                            return;
                          }

                          const reader = new FileReader();

                          reader.onload = async (e) => {
                            try {
                              const arrayBuffer = e.target.result;

                              let tiff;
                              if (GeoTIFF.fromArrayBuffer) {
                                // Modern GeoTIFF version
                                tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
                              } else if (GeoTIFF.parse) {
                                // Older GeoTIFF version
                                tiff = GeoTIFF.parse(arrayBuffer);
                              } else {
                                throw new Error('GeoTIFF version not compatible.');
                              }

                              const image = await tiff.getImage();

                              // Check for bounding box
                              const bbox = image.getBoundingBox();
                              if (!bbox) {
                                throw new Error('The image does not have an affine transformation.');
                              }

                              const rasters = await image.readRasters();

                              this.renderTiff(rasters, bbox);
                            } catch (error) {
                              console.error('Invalid TIFF file:', error.message, error);
                              if (error.message.includes('affine transformation')) {
                                alert('This TIFF file lacks geospatial data and cannot be displayed on the map.');
                              } else {
                                alert(`Failed to load TIFF. Error: ${error.message}`);
                              }
                            }
                          };

                          reader.onerror = () => {
                            alert('An error occurred while reading the file.');
                          };

                          reader.readAsArrayBuffer(file);
                        },


                            renderGeoJson(geojson) {
                              if (!this.map.getSource('geojson-data')) {
                                this.map.addSource('geojson-data', {
                                  type: 'geojson',
                                  data: geojson,
                                });

                                this.map.addLayer({
                                  id: 'geojson-points',
                                  type: 'circle',
                                  source: 'geojson-data',
                                  paint: {
                                    'circle-radius': 6,
                                    'circle-color': '#ff0000',
                                  },
                                  filter: ['==', '$type', 'Point'],
                                });

                                this.map.addLayer({
                                  id: 'geojson-lines',
                                  type: 'line',
                                  source: 'geojson-data',
                                  paint: {
                                    'line-color': '#0000ff',
                                    'line-width': 2,
                                  },
                                  filter: ['==', '$type', 'LineString'],
                                });

                                this.map.addLayer({
                                  id: 'geojson-polygons',
                                  type: 'fill',
                                  source: 'geojson-data',
                                  paint: {
                                    'fill-color': '#00ff00',
                                    'fill-opacity': 0.5,
                                  },
                                  filter: ['==', '$type', 'Polygon'],
                                });
                              } else {
                                this.map.getSource('geojson-data').setData(geojson);
                              }
                            },

                            renderTiff(rasters, bbox) {
                              const [minLng, minLat, maxLng, maxLat] = bbox;

                              const canvas = document.createElement('canvas');
                              canvas.width = rasters.width;
                              canvas.height = rasters.height;

                              const ctx = canvas.getContext('2d');
                              const imageData = ctx.createImageData(rasters.width, rasters.height);
                              const data = imageData.data;

                              for (let i = 0; i < rasters[0].length; i++) {
                                const value = rasters[0][i];
                                data[i * 4] = value;
                                data[i * 4 + 1] = value;
                                data[i * 4 + 2] = value;
                                data[i * 4 + 3] = 255;
                              }

                              ctx.putImageData(imageData, 0, 0);

                              const url = canvas.toDataURL();
                              const imageSource = new mapboxgl.ImageSource({ url, coordinates: [[minLng, maxLat], [maxLng, maxLat]] });

                              this.map.addSource('tiff-image', imageSource);

                              this.map.addLayer({
                                id: 'tiff-layer',
                                type: 'raster',
                                source: 'tiff-image',
                              });

                              this.map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20 });
                            },
                          },
                        };
                        </script>

                        <style scoped>
                        .map-container {
                          position: relative;
                          width: 100%;
                          height: 500px;
                          border-radius: 8px;
                          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                          margin-top: 20px;
                        }

                        #map {
                          width: 100%;
                          height: 100%;
                          border-radius: inherit;
                        }

                        .controls {
                          margin-top: 10px;
                          text-align: center;
                        }

                        button {
                          background-color: #007bff;
                          color: white;
                          border: none;
                          padding: 12px 20px;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 14px;
                        }

                        .button-group {
                            display: flex;
                            justify-content: center;
                            gap: 20px; /* Space out the buttons */
                            position: relative;
                            margin-top: 20px;
                        }
        
                    .geojson-btn {
                    background-color: #007bff;
                    color: white;
                  }

                  .kml-btn {
                    background-color: #28a745;
                    color: white;
                  }

                  .tiff-btn {
                    background-color: #dc3545;
                    color: white;
                  }
                        </style>
