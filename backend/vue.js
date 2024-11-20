import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      selectedFile: null, // To store the selected file for upload
      markers: [], // Array to store markers
      shapes: [],  // Array to store shapes
      currentShapeId: null, // To track selected shape for deletion
    };
  },
  methods: {
    // Login handler
    async handleLogin() {
      try {
        const response = await axios.post("http://localhost:3000/api/auth/login", {
          username: this.username,
          password: this.password,
        });

        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token); // Save token in localStorage
          this.$router.push({ name: 'DashboardPage' }); // Redirect to Dashboard
        } else {
          alert('Invalid credentials!');
        }
      } catch (error) {
        if (error.response) {
          console.error('Login failed:', error.response.data.message || error.response.statusText);
          alert('Invalid credentials or server error!');
        } else if (error.request) {
          console.error('Request failed:', error.request);
          alert('No response from server. Please try again.');
        } else {
          console.error('Error during login:', error.message);
          alert('Something went wrong! Please try again later.');
        }
      }
    },

    // Register handler
    async handleRegister() {
      try {
        const response = await axios.post("http://localhost:3000/api/auth/register", {
          username: this.username,
          password: this.password,
        });

        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token); // Save token in localStorage
          this.$router.push({ name: 'DashboardPage' }); // Redirect to Dashboard
        } else {
          alert('Registration failed!');
        }
      } catch (error) {
        if (error.response) {
          console.error('Registration failed:', error.response.data.message || error.response.statusText);
          alert(error.response.data.message || 'Server error during registration!');
        } else if (error.request) {
          console.error('Request failed:', error.request);
          alert('No response from server. Please try again.');
        } else {
          console.error('Error during registration:', error.message);
          alert('Something went wrong! Please try again later.');
        }
      }
    },

    // File upload handler
    async handleFileUpload() {
      if (!this.selectedFile) {
        alert('Please select a file to upload!');
        return;
      }
    
      const formData = new FormData();
      formData.append('file', this.selectedFile);
    
      try {
        // Send the file to the backend API
        const response = await axios.post('http://localhost:3000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Include token if required
          },
          withCredentials: true, // Include cookies if the server requires authentication
        });
    
        // Handle successful upload
        console.log('File uploaded successfully:', response.data);
        alert('File uploaded successfully!');
        
        // If additional processing (e.g., rendering the file on the map) is needed:
        if (response.data.type === 'geojson') {
          this.addGeoJsonToMap(response.data.data);
        } else {
          alert('File uploaded, but unsupported file type received.');
        }
    
      } catch (error) {
        // Handle errors based on the response
        if (error.response) {
          console.error('File upload failed:', error.response.data?.message || error.response.statusText);
          alert(`File upload failed: ${error.response.data?.message || 'Server error'}`);
        } else if (error.request) {
          console.error('No response from server:', error.request);
          alert('No response from server. Please try again.');
        } else {
          console.error('Error during file upload:', error.message);
          alert('Something went wrong! Please try again later.');
        }
      }
    },
    

    // Save shape to backend
    async saveShape() {
      const shapes = this.draw.getAll();
      console.log('Shapes to save:', shapes);

      try {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await axios.post('http://localhost:3000/api/shapes', { shapes }, {
          headers: {
            'Authorization': `Bearer ${token}` // Include token in the request header
          }
        });
        alert('Shapes saved successfully!');
      } catch (error) {
        console.error('Error saving shapes:', error);
        alert('Failed to save shapes.');
      }
    },

    // Load shapes from backend
    async loadShapes() {
      try {
        const response = await axios.get('http://localhost:3000/api/shapes');
        this.shapes = response.data; // The response data is an array of shapes directly
        this.shapes.forEach(shape => {
          this.draw.add(shape); // Add loaded shapes to Mapbox Draw instance
        });
        alert('Shapes loaded successfully!');
      } catch (error) {
        console.error('Error loading shapes:', error);
        alert('Failed to load shapes.');
      }
    },

    // Delete shape from backend
    async deleteShape() {
      if (!this.currentShapeId) {
        alert('No shape selected for deletion.');
        return;
      }

      try {
        // Assuming the backend requires a token in the request header
        await axios.delete(`http://localhost:3000/api/shapes/${this.currentShapeId}`);
        this.draw.delete(this.currentShapeId); // Remove shape from the map
        this.currentShapeId = null;
        alert('Shape deleted successfully!');
      } catch (error) {
        console.error('Error deleting shape:', error);
        alert('Failed to delete shape.');
      }
    },

    // Save marker to backend
    async saveMarker(marker) {
      try {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await axios.post(
          'http://localhost:3000/api/markers',
          marker,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include token in the request header
            },
          }
        );
        this.markers.push(response.data.marker); // Add marker to local markers array
        alert('Marker saved successfully!');
      } catch (error) {
        console.error('Error saving marker:', error);
        alert('Failed to save marker.');
      }
    },

    // Load all markers from backend
    async loadMarkers() {
      try {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await axios.get('http://localhost:3000/api/markers', {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in the request header
          },
        });
        this.markers = response.data; // Update local markers array
        response.data.forEach((markerData) => {
          const marker = new mapboxgl.Marker({ draggable: true })
            .setLngLat(markerData.coordinates) // Set the coordinates for the marker
            .addTo(this.map);

          marker._id = markerData._id; // Save the unique ID from the backend
          marker.on("dragend", () => {
            this.updateMarkerPosition(marker);
          });

          this.markers.push(marker); // Add marker to local state for deletion later
        });
        alert('Markers loaded successfully!');
      } catch (error) {
        console.error('Error loading markers:', error);
        alert('Failed to load markers.');
      }
    },

    // Update marker position (after drag event)
    updateMarkerPosition(marker) {
      const token = localStorage.getItem('authToken');
      const updatedPosition = marker.getLngLat();
      const markerId = marker._id;
      
      axios.put(`http://localhost:3000/api/markers/${markerId}`, {
        coordinates: updatedPosition,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        console.log('Marker position updated:', response.data);
      })
      .catch(error => {
        console.error('Error updating marker position:', error);
      });
    },
  },
};
