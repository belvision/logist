module.exports = {
  apps: [
    {
      name: 'logistgo-backend',
      script: 'npm',
      args: 'run dev',
      cwd: './apps/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5555,
        // MinIO Production Settings
        MINIO_ENDPOINT: 'io.logistgo.pro',
        MINIO_PORT: '443',
        MINIO_USE_SSL: 'true',
        MINIO_ACCESS_KEY: 'REDACTED_SECRET',
        MINIO_SECRET_KEY: 'JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t',
        MINIO_BUCKET_NAME: 'logistic-pro'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'logistgo-frontend',
      script: 'npm',
      args: 'start',
      cwd: './apps/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
