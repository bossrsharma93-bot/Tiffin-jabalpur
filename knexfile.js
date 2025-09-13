module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.PGHOST || 'db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'tiffin',
      port: process.env.PGPORT || 5432
    },
    migrations: { directory: __dirname + '/migrations' },
    seeds: { directory: __dirname + '/seeds' }
  }
};
