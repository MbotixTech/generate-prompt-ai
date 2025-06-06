import { jwtDecode } from "jwt-decode";

/**
 * Protects routes that require authentication
 */
export function requireAuth() {
  // Check if user is authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }
  
  try {
    // Check if token is expired
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the user has admin role
 */
export function requireAdmin() {
  // First check authentication
  if (!requireAuth()) {
    return false;
  }
  
  // Then check if user is admin from local storage
  // This is a simple check, the backend will do a proper check
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return false;
  }
  
  try {
    const user = JSON.parse(userStr);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
}
