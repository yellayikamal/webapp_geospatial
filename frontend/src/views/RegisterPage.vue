<template>
  <div class="register-container">
    <div class="register-box">
      <form @submit.prevent="handleRegister">
        <h2>Register</h2>
        <div class="input-group">
          <label for="username">Username</label>
          <input
            v-model="username"
            type="text"
            id="username"
            placeholder="Enter your username"
            required
          />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-container">
            <input
              v-model="password"
              :type="passwordVisible ? 'text' : 'password'"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
import Swal from 'sweetalert2'; // Import SweetAlert2

export default {
  data() {
    return {
      username: '',
      password: '',
      passwordVisible: false, // Toggle for password visibility
    };
  },
  methods: {
    async handleRegister() {
      try {
        await axios.post("http://localhost:3000/api/auth/register", {
          username: this.username,
          password: this.password,
        });

        // Success Alert using SweetAlert2
        Swal.fire({
          title: 'Success!',
          text: 'User registered successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        this.username = '';
        this.password = '';
        this.passwordVisible = false; // Reset password visibility

        this.$router.push({ name: 'LoginPage' });
        
      } catch (error) {
        console.error("Registration error:", error);

        // Check if the error is about user already existing
        if (error.response?.data?.message === 'User already exists') {
          // Info Alert for existing user
          Swal.fire({
            title: 'Info!',
            text: 'This username is already taken. Please choose another one.',
            icon: 'info',
            confirmButtonText: 'Try Again',
            showCancelButton: true,
            cancelButtonText: 'Back to Login',
            reverseButtons: true
          }).then((result) => {
            if (result.isDismissed) {
              // Redirect to login page if user clicks 'Back to Login'
              this.$router.push({ name: 'LoginPage' });
            }
          });
        } else {
          // Error Alert for general registration failure
          Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || "Registration failed.",
            icon: 'error',
            confirmButtonText: 'Try Again'
          });
        }
      }
    },
    // Toggle password visibility
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    }
  }
};
</script>


<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-container {
  width: 100%;
  height: 97vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('../assets/geospatial.jpg') no-repeat center center fixed;
  background-size: cover;
}

.register-box {
  background: rgba(255, 255, 255, 0.8);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

input:focus {
  border-color: #4caf50;
  outline: none;
}

.password-container {
  position: relative;
}

.password-toggle-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  width: 20px;  /* Adjust size */
  height: 20px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.forgot-password {
  margin-top: 15px;
  font-size: 14px;
  color: #0a0a0a;
}

.forgot-password:hover {
  color: #4caf50;
  cursor: pointer;
}
</style>

