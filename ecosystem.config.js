module.exports = {
  apps: [
    {
      name: "basak",
      script: "server.js",
      // All env vars are injected by Hostinger — do not duplicate them here
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
