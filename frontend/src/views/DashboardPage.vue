<template>
  <div>
    <!-- Menu Bar -->
    <nav class="menu-bar">
      <ul>
        <li><router-link to="/upload" class="nav-link">Upload Files</router-link></li>
        <li><router-link to="/draw" class="nav-link">Draw Shapes</router-link></li>
        <li><router-link to="/markers" class="nav-link">Manage Markers</router-link></li>
        <li><router-link to="/measure" class="nav-link">Measure Distance</router-link></li>
        <li><router-link to="/hover" class="nav-link">Hover</router-link></li>
        <!-- PNG Image for Logout -->
        <li>
          <img 
            src="../assets/out.png" 
            alt="Logout" 
            @click="logout" 
            class="logout-image" 
            style="margin-top: -6px;"
          />
        </li>
      </ul>
    </nav>

    <!-- Render current route component here -->
    <router-view />

    <!-- Main Content -->
    <div class="main-content">
      <div v-if="isDashboardPage" class="dashboard-content-container">
        <!-- Replace the map with a PNG image -->
        <img src="../assets/geospatial.jpg" alt="Dashboard" class="dashboard-image" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // No need for map-related data anymore
    };
  },
  computed: {
    isDashboardPage() {
      return this.$route.name === 'dashboard';
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('authToken');
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
/* Menu Bar Styling */
.menu-bar {
  background-color: #7e7f81;
  padding: 15px;
  display: flex;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative; /* Required for absolute positioning of logout image */
}

.menu-bar ul {
  list-style-type: none;
  display: flex;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-link:hover {
  background-color: #2c3844;
  color: #f8f9fa;
}

/* Main Content Styling */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
}

.dashboard-content-container {
  width: 100%;
  height: 500px;
  margin-top: 30px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0; /* Temporary background for visibility */
}

.dashboard-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

/* PNG Logout Image Styling */
.logout-image {
  width: 30px; /* Adjust size */
  height: 30px; /* Adjust size */
  cursor: pointer;
  transition: transform 0.3s ease;
  position: absolute;
  right: 20px; /* Position it on the right */
}

.logout-image:hover {
  transform: scale(1.2); /* Slight zoom effect on hover */
}
</style>
