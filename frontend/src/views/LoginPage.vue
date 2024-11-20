<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
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
          <div class="password-input-container">
            <input
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit">Login</button>
        </div>
      </form>
      <p class="forgot-password" @click="navigateToForgotPassword">Forgot your password?</p>
      <p class="register-option">Don’t have an account? <span @click="navigateToRegister">Register here</span></p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  data() {
    return {
      username: "",
      password: "",
      isPasswordVisible: false,  // Control visibility of the password
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await axios.post("http://localhost:3000/api/auth/login", {
          username: this.username,
          password: this.password,
        });

        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          this.$router.push({ name: 'DashboardPage' });
          Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'You have been successfully logged in.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed!',
            text: 'Invalid credentials. Please try again.',
          });
        }
      } catch (error) {
        if (error.response) {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed!',
            text: error.response.data.message || error.response.statusText,
          });
        } else if (error.request) {
          Swal.fire({
            icon: 'error',
            title: 'No Response!',
            text: 'Unable to get a response from the server. Please try again.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Something went wrong. Please try again later.',
          });
        }
      }
    },
    navigateToRegister() {
      this.$router.push({ name: 'RegisterPage' });
    },
    navigateToForgotPassword() {
      Swal.fire({
        icon: 'info',
        title: 'Forgot Password',
        text: "Forgot password functionality is not yet implemented.",
      });
    },
    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
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
  height: 100vh; /* Ensure the body takes the full viewport height */
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  width: 100%;
  height: 97vh; /* Ensure container takes full viewport height */
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('../assets/geospatial.jpg') no-repeat center center fixed; /* Add the background image */
  background-size: cover; /* Make the background image cover the whole container */
}

.login-box {
  background: rgba(255, 255, 255, 0.8); /* Add transparency to the form background */
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

.password-input-container {
  position: relative;
}

.password-toggle-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  width: 20px;  /* Adjust the size of the icon */
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

.register-option {
  margin-top: 15px;
  font-size: 14px;
  color: #0a0a0a;
}

.register-option span {
  color: #4caf50;
  cursor: pointer;
}

.register-option span:hover {
  text-decoration: underline;
}

</style>
