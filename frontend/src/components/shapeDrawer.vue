<template>
  <div id="app">
    <div ref="map" class="map-container"></div>
    <div class="button-group">
      <button @click="saveShape" class="save-btn">Save Shapes</button>
      <button @click="loadShapes" class="load-btn">Load Shapes</button>
      <button @click="deleteShape" class="delete-btn">Delete Shape</button>
    </div>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: "ShapeDrawer",
  data() {
    return {
      map: null,
      draw: null,
      currentShapeId: null,
      shapes: [],
    };
  },
  async mounted() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2FtYWx5ZWxsYXlpMTkiLCJhIjoiY20zZTl2Yzk5MDl5ZDJrcjN6aDIxeDZkOSJ9.6J4CPNKKadbo5Afv4zznbA';
    this.map = new mapboxgl.Map({
      container: this.$refs.map,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.006, 40.7128],
      zoom: 13,
    });

    this.draw = new MapboxDraw({
      displayControlsDefault: true,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
      },
    });

    this.map.addControl(this.draw);

    await this.loadShapes();

    this.map.on('draw.create', this.updateShape);
    this.map.on('draw.update', this.updateShape);
    this.map.on('draw.delete', this.updateShape);

    this.map.on('draw.selectionchange', (event) => {
      const selectedFeatures = event.features;
      this.currentShapeId = selectedFeatures.length > 0 ? selectedFeatures[0].id : null;
    });
  },
  methods: {
    updateShape() {
      const shapes = this.draw.getAll();
      this.shapes = shapes.features;
    },

    async loadShapes() {
  try {
    const response = await axios.get('http://localhost:3000/api/shapes');
    console.log('Shapes Data:', response.data); // Log the response data

    const shapes = response.data;

    // Check if shapes have a 'features' array and its length
    if (!shapes || !shapes.features || shapes.features.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Shapes Found',
        text: 'No shapes data found on the server.',
      });
      return;
    }

    this.draw.deleteAll(); // Clear any existing shapes from the map
    shapes.features.forEach(shape => {
      this.draw.add(shape); // Add each shape to the map
    });

    Swal.fire({
      icon: 'success',
      title: 'Shapes Loaded',
      text: 'Shapes loaded successfully from the server!',
    });
  } catch (error) {
    console.error('Error loading shapes:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load shapes. Please try again.',
    });
  }
},


    async saveShape() {
  const shapes = this.draw.getAll(); // This is a GeoJSON object with "features"
  const shapeData = { shapes: shapes.features }; // Sending only the "features" array

  try {
    const token = localStorage.getItem('authToken');
    await axios.post('http://localhost:3000/api/shapes', shapeData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    Swal.fire({
      icon: 'success',
      title: 'Shapes Saved',
      text: 'Your shapes have been saved successfully!',
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to save shapes. Please try again.',
    });
  }
},

async deleteShape() {
  if (!this.currentShapeId) {
    Swal.fire({
      icon: 'info',
      title: 'No Shape Selected',
      text: 'Please select a shape to delete first.',
    });
    return;
  }

  console.log("Shape ID to delete:", this.currentShapeId); // Log the shape ID

  try {
    const response = await axios.delete(`http://localhost:3000/api/shapes/${this.currentShapeId}`);
    console.log("Delete response:", response); // Log the response from delete

    this.draw.delete(this.currentShapeId); // Remove the shape from the map
    await this.loadShapes(); // Reload shapes to get updated list

    Swal.fire({
      icon: 'success',
      title: 'Shape Deleted',
      text: 'The selected shape has been deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting shape:', error); // Log error for troubleshooting
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to delete the shape. Please try again.',
    });
  }
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

.delete-btn {
  background-color: #dc3545;
  color: white;
}

button:hover {
  opacity: 0.9;
}
</style>
