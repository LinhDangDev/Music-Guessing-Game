// Configuration for API endpoints
const config = {
  // API URL from environment variables
  API_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',

  // Audio clips URL from environment variables
  CLIPS_URL: import.meta.env.VITE_CLIPS_URL || 'http://localhost:5000/assets/clips',
};

export default config;
