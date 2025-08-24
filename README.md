# Where Am I

A geolocation web app with Node.js + TypeScript backend on AWS.

## Features

- React frontend with Vite
- Node.js API backend
- AWS CDK infrastructure
- Docker containerization

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and pnpm (for local development)

### Using Docker (Recommended)

1. **Build and run the production container:**
   ```bash
   ./docker-build.sh build
   ./docker-build.sh run
   ```

2. **Or use docker-compose directly:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:8787

### Development with Docker

1. **Build and run the development container:**
   ```bash
   ./docker-build.sh build:dev
   ./docker-build.sh run:dev
   ```

2. **Access the development environment:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### Docker Commands

```bash
# Build production image
./docker-build.sh build

# Build development image
./docker-build.sh build:dev

# Run production container
./docker-build.sh run

# Run development container
./docker-build.sh run:dev

# Stop containers
./docker-build.sh stop

# View logs
./docker-build.sh logs

# Clean up Docker resources
./docker-build.sh cleanup

# Show help
./docker-build.sh help
```

## Local Development (without Docker)

### Prerequisites

- Node.js 20+
- pnpm 8+

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development servers:**
   ```bash
   pnpm dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:8787

## Project Structure

```
where-am-i/
├── packages/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Node.js API backend
├── infra/            # AWS CDK infrastructure
├── Dockerfile        # Production Docker image
├── Dockerfile.dev    # Development Docker image
├── docker-compose.yml # Docker Compose configuration
└── docker-build.sh   # Docker build and run script
```

## Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm start` - Start production servers
- `pnpm test` - Run tests
- `pnpm lint` - Run linting
- `pnpm deploy` - Deploy infrastructure
- `pnpm destroy` - Destroy infrastructure

## Docker Configuration

### Production Image
- Multi-stage build for optimized image size
- Runs both frontend and API in a single container
- Uses `serve` for static file serving
- Non-root user for security
- Health checks included

### Development Image
- Source code mounted for hot reloading
- Includes all development dependencies
- Separate ports (3000, 3001) to avoid conflicts

## Deployment

### Local Docker
```bash
./docker-build.sh build
./docker-build.sh run
```

### Production with GitHub Actions
The project includes automated GitHub Actions workflows that:
- Build and test Docker containers
- Push to GitHub Container Registry
- Deploy to AWS infrastructure
- Create automatic releases

See [GITHUB_ACTIONS_DOCKER.md](./GITHUB_ACTIONS_DOCKER.md) for detailed setup instructions.

### Manual Production Deployment
```bash
# Build and push to registry
docker build -t your-registry/where-am-i:latest .
docker push your-registry/where-am-i:latest

# Deploy infrastructure
pnpm deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Add your license here]
