<template>
  <div>
    <div ref="map" class="map"></div>
    <div v-if="hoverInfo" class="hover-card" :style="{ top: hoverPosition.y + 'px', left: hoverPosition.x + 'px' }">
      <p>{{ hoverInfo.name }}</p>
      <p>{{ hoverInfo.description }}</p>
    </div>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';

export default {
  data() {
    return {
      map: null,
      hoverInfo: null,
      hoverPosition: { x: 0, y: 0 },
    };
  },
  mounted() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2FtYWx5ZWxsYXlpMTkiLCJhIjoiY20zZTl2Yzk5MDl5ZDJrcjN6aDIxeDZkOSJ9.6J4CPNKKadbo5Afv4zznbA'; // Replace with your access token
    this.map = new mapboxgl.Map({
      container: this.$refs.map,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.006, 40.7128],
      zoom: 13,
    });

    // Replace 'your-layer-id' with your actual layer ID
    this.map.on('mouseenter', 'raster-layer', (e) => {
      // Check if e.features is available
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        this.hoverInfo = feature.properties;
        this.hoverPosition = { x: e.point.x, y: e.point.y };
      }
    });

    // Clear hover info when mouse leaves
    this.map.on('mouseleave', 'raster-layer', () => {
      this.hoverInfo = null;
    });
  },
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
.hover-card {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  padding: 8px;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  pointer-events: none; /* Prevents hover card from blocking map interactions */
}
</style>
