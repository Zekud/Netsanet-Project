// ecosystem.config.js — Production process management for Netsanet
// Configures PM2 to run both the Node.js Express backend and the Python FastAPI RAG service.

module.exports = {
  apps: [
    {
      name: 'netsanet-backend',
      script: 'dist/index.js',
      cwd: './backend',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'netsanet-rag',
      script: 'venv/bin/python',
      args: '-m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: './rag-service',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 8000,
      },
    },
  ],
};
