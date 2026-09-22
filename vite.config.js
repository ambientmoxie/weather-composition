export default {
  root: "src",
  base: "/weather-comp",
  envDir: "../",
  server: { host: true },
  build: {
    outDir: "../dist",
    chunkSizeWarningLimit: 1000,
  },
};
