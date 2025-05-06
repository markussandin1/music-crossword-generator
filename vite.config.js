export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Ensure this matches your backend URL
        changeOrigin: true,
        secure: false
      }
    }
  }
};
