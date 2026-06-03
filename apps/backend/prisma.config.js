const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { defineConfig } = require("@prisma/config");

module.exports = defineConfig({
  datasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL,
    extensions: ["postgis", "pg_trgm", "uuid_ossp"],
  },
});
