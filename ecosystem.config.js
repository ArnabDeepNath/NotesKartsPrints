module.exports = {
  apps: [
    {
      name: "basak-client",
      script: ".next/standalone/server.js",
      cwd: "/home/u123456789/public_html", // ← Change to your Hostinger path
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "https://yourdomain.com/api", // ← Change
        HOSTNAME: "0.0.0.0",
      },
    },
    {
      name: "basak-server",
      script: "src/server.js",
      cwd: "/home/u123456789/public_html/server", // ← Change to your Hostinger path
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        DATABASE_URL: "mysql://user:password@localhost:3306/basakdb", // ← Change
        JWT_ACCESS_SECRET: "change-this-to-a-long-random-secret-1",
        JWT_REFRESH_SECRET: "change-this-to-a-long-random-secret-2",
        CLIENT_URL: "https://yourdomain.com",
        ALLOWED_ORIGINS: "https://yourdomain.com",
        STRIPE_SECRET_KEY: "sk_live_xxxx",
        STRIPE_WEBHOOK_SECRET: "whsec_xxxx",
      },
    },
  ],
};
