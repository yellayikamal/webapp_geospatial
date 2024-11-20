      <template>
        <div class="coordinate-input">
          <div id="map" ref="mapContainer" class="map-container"></div>
          <div class="input-section">
            <div class="coordinate-box">
              <label for="lat1">Latitude 1:</label>
              <input v-model="lat1" type="number" placeholder="Enter Latitude 1" class="coordinate-input-field" />
            </div>
            <div class="coordinate-box">
              <label for="lon1">Longitude 1:</label>
              <input v-model="lon1" type="number" placeholder="Enter Longitude 1" class="coordinate-input-field" />
            </div>
            <div class="coordinate-box">
              <label for="lat2">Latitude 2:</label>
              <input v-model="lat2" type="number" placeholder="Enter Latitude 2" class="coordinate-input-field" />
            </div>
            <div class="coordinate-box">
              <label for="lon2">Longitude 2:</label>
              <input v-model="lon2" type="number" placeholder="Enter Longitude 2" class="coordinate-input-field" />
            </div>
            <div class="button-container">
              <button @click="startMeasuring" class="measure-btn">Start Measuring</button>
              <button @click="calculateDistance" class="calculate-btn">Calculate Distance</button>
              <button @click="resetMarkers" class="reset-btn">Reset</button>
              <button @click="saveMarkersToFile" class="save-btn">Save Markers</button>
            </div>
          </div>
        </div>
      </template>

      <script>
      import axios from "axios";
      import mapboxgl from "mapbox-gl";
      import Swal from "sweetalert2";

      export default {
        name: "DistanceMeasure",
        data() {
          return {
            lat1: null,
            lon1: null,
            lat2: null,
            lon2: null,
            distance: null,
            map: null,
            startPoint: null,
            endPoint: null,
            measuring: false,
            markers: [], // Shared array for all markers
          };
        },
        mounted() {
          this.initializeMap();
        },
        methods: {
          initializeMap() {
            mapboxgl.accessToken = "pk.eyJ1Ijoia2FtYWx5ZWxsYXlpMTkiLCJhIjoiY20zZTl2Yzk5MDl5ZDJrcjN6aDIxeDZkOSJ9.6J4CPNKKadbo5Afv4zznbA";
            this.map = new mapboxgl.Map({
              container: this.$refs.mapContainer,
              style: "mapbox://styles/mapbox/streets-v11",
              center: [-74.006, 40.7128],
              zoom: 10,
            });
            this.map.addControl(new mapboxgl.NavigationControl());
          },
          startMeasuring() {
            if (this.measuring) {
              Swal.fire("Measuring already started!", "", "info");
              return;
            }
            this.measuring = true;
            this.map.on("click", this.setStartPoint);
          },
          setStartPoint(event) {
            if (!this.startPoint) {
              this.startPoint = event.lngLat;
              const marker = new mapboxgl.Marker()
                .setLngLat(this.startPoint)
                .addTo(this.map)
                .setPopup(new mapboxgl.Popup().setText("Start Point"));
              this.markers.push(marker);
              Swal.fire("Start point set!", "Now click to set the end point.", "success");
            } else {
              this.setEndPoint(event);
            }
          },
          setEndPoint(event) {
            this.endPoint = event.lngLat;
            const marker = new mapboxgl.Marker()
              .setLngLat(this.endPoint)
              .addTo(this.map)
              .setPopup(new mapboxgl.Popup().setText("End Point"));
            this.markers.push(marker);
            this.calculateDistanceFromMap();
          },
          calculateDistanceFromMap() {
            if (!this.startPoint || !this.endPoint) {
              Swal.fire("Set both points to calculate distance.", "", "warning");
              return;
            }
            const distanceInMeters = this.startPoint.distanceTo(this.endPoint);
            this.distance = (distanceInMeters / 1000).toFixed(2);
            Swal.fire(`Calculated Distance: ${this.distance} km`, "", "success");
          },
          async calculateDistance() {
            if (!this.lat1 || !this.lon1 || !this.lat2 || !this.lon2) {
              Swal.fire("Please provide all coordinates.", "", "warning");
              return;
            }
            try {
              const response = await axios.post("http://localhost:3000/api/distance", {
                lat1: this.lat1,
                lon1: this.lon1,
                lat2: this.lat2,
                lon2: this.lon2,
              });
              this.distance = response.data.distance;
              Swal.fire(`Calculated Distance: ${this.distance} km`, "", "success");
            } catch (error) {
              Swal.fire("Error calculating distance.", "Try again later.", "error");
            }
          },
          resetMarkers() {
            this.markers.forEach((marker) => marker.remove());
            this.markers = [];
            this.startPoint = null;
            this.endPoint = null;
            this.measuring = false; // Reset measuring mode
            Swal.fire("Reset", "All markers have been removed.", "info");
          },
          saveMarkersToFile() {
            if (this.markers.length === 0) {
              Swal.fire("No markers to save.", "", "info");
              return;
            }
            const markerData = this.markers.map((marker) => marker.getLngLat());
            const blob = new Blob([JSON.stringify(markerData, null, 2)], {
              type: "application/json",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "markers.json";
            link.click();
            Swal.fire("Markers saved!", "Your markers have been saved to a file.", "success");
          },
        },
      };
      </script>


      <style scoped>
      .map-container {
        width: 100%;
        height: 500px;
        margin-top: 20px;
        border-radius: 8px;
      }
      .button-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
      }
      button {
        width: 100px;
        padding: 8px;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
      }
      .measure-btn { background-color: #007bff; color: white; }
      .calculate-btn { background-color: #28a745; color: white; }
      .reset-btn { background-color: #ff6347; color: white; }
      .save-btn { background-color: #ffc107; color: white; }
      .input-section {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .coordinate-box {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .coordinate-input-field {
        padding: 4px;
        font-size: 12px;
        border-radius: 4px;
      }
      </style>
