module.exports = {
  apps: [
    {
      name: "barrer-shop",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      cwd: __dirname,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
