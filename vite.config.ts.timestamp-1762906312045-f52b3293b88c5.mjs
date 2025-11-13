// vite.config.ts
import { defineConfig } from "file:///D:/PWA/Aprod/node_modules/vite/dist/node/index.js";
import react from "file:///D:/PWA/Aprod/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import dotenv from "file:///D:/PWA/Aprod/node_modules/dotenv/lib/main.js";
var __vite_injected_original_dirname = "D:\\PWA\\Aprod";
dotenv.config();
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "./shared")
    }
  },
  // === JAVÍTOTT RÉSZ ===
  // Beállítások a fejlesztői (dev) szerverhez
  server: {
    host: "0.0.0.0",
    // Vagy 'true'. Így fejlesztés közben is 0.0.0.0-n fut
    port: 5e3
    // Opcionális, ha fix portot akarsz fejlesztés közben
  },
  // Beállítások a production (preview) szerverhez
  // EZ A LEGFONTOSABB A RENDER SZÁMÁRA!
  preview: {
    host: "0.0.0.0",
    // Ez mondja meg a ViteExpress-nek, hogy 0.0.0.0-n fusson
    port: Number(process.env.PORT) || 5e3
    // Render ebből olvassa ki a portot
  }
  // =====================
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQV0FcXFxcQXByb2RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFBXQVxcXFxBcHJvZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovUFdBL0Fwcm9kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcbmRvdGVudi5jb25maWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgXCJAc2hhcmVkXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zaGFyZWRcIiksXG4gICAgfSxcbiAgfSxcblxuICAvLyA9PT0gSkFWXHUwMENEVE9UVCBSXHUwMEM5U1ogPT09XG5cbiAgLy8gQmVcdTAwRTFsbFx1MDBFRHRcdTAwRTFzb2sgYSBmZWpsZXN6dFx1MDE1MWkgKGRldikgc3plcnZlcmhlelxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsIC8vIFZhZ3kgJ3RydWUnLiBcdTAwQ0RneSBmZWpsZXN6dFx1MDBFOXMga1x1MDBGNnpiZW4gaXMgMC4wLjAuMC1uIGZ1dFxuICAgIHBvcnQ6IDUwMDAgLy8gT3BjaW9uXHUwMEUxbGlzLCBoYSBmaXggcG9ydG90IGFrYXJzeiBmZWpsZXN6dFx1MDBFOXMga1x1MDBGNnpiZW5cbiAgfSxcblxuICAvLyBCZVx1MDBFMWxsXHUwMEVEdFx1MDBFMXNvayBhIHByb2R1Y3Rpb24gKHByZXZpZXcpIHN6ZXJ2ZXJoZXpcbiAgLy8gRVogQSBMRUdGT05UT1NBQkIgQSBSRU5ERVIgU1pcdTAwQzFNXHUwMEMxUkEhXG4gIHByZXZpZXc6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsIC8vIEV6IG1vbmRqYSBtZWcgYSBWaXRlRXhwcmVzcy1uZWssIGhvZ3kgMC4wLjAuMC1uIGZ1c3NvblxuICAgIHBvcnQ6IE51bWJlcihwcm9jZXNzLmVudi5QT1JUKSB8fCA1MDAwIC8vIFJlbmRlciBlYmJcdTAxNTFsIG9sdmFzc2Ega2kgYSBwb3J0b3RcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUE0TixTQUFTLG9CQUFvQjtBQUN6UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sWUFBWTtBQUhuQixJQUFNLG1DQUFtQztBQUl6QyxPQUFPLE9BQU87QUFFZCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3BDLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFVBQVU7QUFBQSxJQUMvQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFLQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUEsRUFJQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU0sT0FBTyxRQUFRLElBQUksSUFBSSxLQUFLO0FBQUE7QUFBQSxFQUNwQztBQUFBO0FBR0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
