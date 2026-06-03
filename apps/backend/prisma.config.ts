const config = {
  datasources: {
    db: {
      provider: "postgresql",
      url: process.env.DATABASE_URL,
      extensions: ["postgis", "pg_trgm", "uuid_ossp"],
    },
  },
};

export default config;
