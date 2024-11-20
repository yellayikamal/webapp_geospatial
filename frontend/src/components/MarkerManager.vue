      <template>
        <div id="app">
          <div ref="map" class="map-container"></div>
          <div class="button-group">
            <button @click="saveMarkers" class="save-btn">Save Markers</button>
            <button @click="loadMarkers" class="load-btn">Load Markers</button>
            <button @click="resetMarkers" class="reset-btn">Reset Markers</button>
          </div>
        </div>
      </template>


      <script>
      import mapboxgl from "mapbox-gl";
      import axios from "axios";
      import Swal from "sweetalert2";
      import "sweetalert2/dist/sweetalert2.min.css";

      export default {
        name: "MarkerManager",
        data() {
          return {
            map: null,
            markers: [],
            baseUrl: "http://localhost:3000/api/markers", // Backend API URL
            isRemoveModeEnabled: false,
          };
        },
        mounted() {
          mapboxgl.accessToken =
            "pk.eyJ1Ijoia2FtYWx5ZWxsYXlpMTkiLCJhIjoiY20zZTl2Yzk5MDl5ZDJrcjN6aDIxeDZkOSJ9.6J4CPNKKadbo5Afv4zznbA"; // Mapbox token
          this.map = new mapboxgl.Map({
            container: this.$refs.map,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [-74.006, 40.7128], // Default coordinates (New York)
            zoom: 12,
          });

          this.map.on("click", this.handleMapClick);
          this.loadMarkers(); // Load markers from the backend when the component is mounted
        },
        methods: {
          handleMapClick(e) {
            console.log("Click coordinates:", e.lngLat); // Log the clicked coordinates

            if (!this.isRemoveModeEnabled) {
              this.addMarker(e); // Add a marker if remove mode is not enabled
            } else {
              this.removeMarker(e.lngLat); // Directly remove the marker if remove mode is enabled
            }
          },

          addMarker(e) {
            const newMarker = new mapboxgl.Marker({ draggable: true })
              .setLngLat(e.lngLat)
              .addTo(this.map);

            newMarker.on("dragend", () => {
              this.updateMarkerPosition(newMarker); // Update marker position after drag
            });

            this.markers.push(newMarker); // Add the marker to the local state
          },

          async saveMarkers() {
            const markerData = this.markers.map((marker) => ({
              coordinates: marker.getLngLat().toArray(),
            }));

            try {
              await axios.post(this.baseUrl, { markers: markerData });
              Swal.fire("Success", "Markers saved successfully!", "success");
            } catch (error) {
              console.error("Error saving markers:", error);
              Swal.fire("Error", "Failed to save markers.", "error");
            }
          },

          async loadMarkers() {
            try {
              const response = await axios.get(this.baseUrl);
              response.data.forEach((markerData) => {
                const marker = new mapboxgl.Marker({ draggable: true })
                  .setLngLat(markerData.coordinates)
                  .addTo(this.map);

                // Ensure the marker has the _id property from backend
                marker._id = markerData._id;
                marker.on("dragend", () => {
                  this.updateMarkerPosition(marker);
                });

                this.markers.push(marker);
              });
              Swal.fire("Loaded", "Markers loaded successfully!", "success");
            } catch (error) {
              console.error("Error loading markers:", error);
              Swal.fire("Error", "Failed to load markers.", "error");
            }
          },

          removeMarker(lngLat) {
            console.log("Trying to remove marker at:", lngLat); // Log clicked coordinates

            // Find the marker based on the clicked coordinates
            const marker = this.markers.find(
              (m) =>
                Math.abs(m.getLngLat().lng - lngLat.lng) < 0.0001 && 
                Math.abs(m.getLngLat().lat - lngLat.lat) < 0.0001
            );

            if (marker) {
              console.log("Marker found:", marker.getLngLat()); // Log the coordinates of the found marker
              marker.remove();
              this.markers = this.markers.filter((m) => m !== marker); // Remove it from the local state
              Swal.fire("Removed", "Marker removed from the map.", "info");
            } else {
              console.log("Marker not found for removal."); // Log when marker is not found
              Swal.fire("Error", "Marker not found!", "error");
            }
          },

          async updateMarkerPosition(marker) {
            const coordinates = marker.getLngLat().toArray();

            try {
              await axios.put(`${this.baseUrl}/${marker._id}`, { coordinates });
            } catch (error) {
              console.error("Error updating marker:", error);
            }
          },
          resetMarkers() {
            // Remove all markers from the map and reset the local state
            this.markers.forEach((marker) => marker.remove());
            this.markers = [];
            Swal.fire("Reset", "All markers have been removed.", "info");
          },
        },
      };
      </script>


      <style scoped>
      .map-container {
        position: relative;
        height: 80vh; /* Reduce the map height to leave space for buttons */
        width: 100%;
        border-radius: 8px;
      }

      .button-group {
        display: flex;
        justify-content: center;
        gap: 20px; /* Space out the buttons */
        position: relative;
        margin-top: 20px;
      }

      button {
        padding: 12px 20px;
        font-size: 14px;
        border-radius: 6px;
        cursor: pointer;
        border: none;
        transition: background-color 0.3s ease;
      }

        .save-btn {
          background-color: #007bff;
          color: white;
        }

        .load-btn {
          background-color: #28a745;
          color: white;
        }

        .reset-btn {
          background-color: #dc3545;
          color: white;
        }

      button:hover {
        opacity: 0.9;
      }
      </style>
