# Docker Deployment Guide for SalesFlow Pro

This guide explains how to containerize and deploy the SalesFlow Pro application using Docker.

## 📋 Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)
- Git (for cloning the repository)

## 🏗️ Project Structure

```
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev            # Development Docker image
├── docker-compose.yml        # Docker Compose configuration
├── .dockerignore            # Files to exclude from Docker build
├── server.js                # Express.js server
├── package.json             # Node.js dependencies and scripts
└── src/                     # React application source code
```

## 🚀 Quick Start

### Production Deployment

1. **Build and run with Docker Compose (Recommended):**
   ```bash
   npm run docker:compose:up
   ```

2. **Or build and run manually:**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:5000`
   - Health check endpoint: `http://localhost:5000/health`

### Development Environment

1. **Run development container:**
   ```bash
   npm run docker:build:dev
   npm run docker:run:dev
   ```

2. **Access the development server:**
   - Open your browser and navigate to `http://localhost:3000`
   - Hot reload is enabled for live development

## 🐳 Docker Commands Reference

### Building Images

```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Manual build commands
docker build -t salesflow-pro .
docker build -f Dockerfile.dev -t salesflow-pro:dev .
```

### Running Containers

```bash
# Run production container
npm run docker:run

# Run development container with volume mounting
npm run docker:run:dev

# Manual run commands
docker run -p 5000:5000 salesflow-pro
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules salesflow-pro:dev
```

### Docker Compose Operations

```bash
# Start all services (builds if needed)
npm run docker:compose:up

# Start only production service
npm run docker:compose:up:prod

# Start only development service (uncomment in docker-compose.yml first)
npm run docker:compose:up:dev

# Stop all services
npm run docker:compose:down

# Clean up Docker resources
npm run docker:clean
```

## 🔧 Environment Configuration

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Port number for the server (default: 5000)

### Production Environment

```bash
docker run -p 5000:5000 -e NODE_ENV=production -e PORT=5000 salesflow-pro
```

### Custom Port

```bash
docker run -p 8080:8080 -e PORT=8080 salesflow-pro
```

## 📊 Health Monitoring

The application includes a health check endpoint that monitors:
- Server status
- Application version
- Timestamp

**Health Check URL:** `http://localhost:5000/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "0.1.0",
  "name": "SalesFlow Pro"
}
```

## 🚢 Cloud Deployment Options

### 1. Docker Hub Deployment

```bash
# Tag your image
docker tag salesflow-pro your-dockerhub-username/salesflow-pro:latest

# Push to Docker Hub
docker push your-dockerhub-username/salesflow-pro:latest

# Pull and run on any Docker-enabled server
docker pull your-dockerhub-username/salesflow-pro:latest
docker run -p 5000:5000 your-dockerhub-username/salesflow-pro:latest
```

### 2. AWS ECS Deployment

1. Push image to Amazon ECR
2. Create ECS task definition
3. Deploy to ECS cluster

### 3. Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/your-project-id/salesflow-pro

# Deploy to Cloud Run
gcloud run deploy salesflow-pro --image gcr.io/your-project-id/salesflow-pro --platform managed
```

### 4. Azure Container Instances

```bash
# Create resource group
az group create --name salesflow-rg --location eastus

# Deploy container
az container create --resource-group salesflow-rg --name salesflow-pro --image your-registry/salesflow-pro:latest --dns-name-label salesflow-pro --ports 5000
```

### 5. Heroku Container Registry

```bash
# Login to Heroku Container Registry
heroku container:login

# Build and push
heroku container:push web --app your-heroku-app-name

# Release
heroku container:release web --app your-heroku-app-name
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5000
   
   # Use a different port
   docker run -p 8080:5000 salesflow-pro
   ```

2. **Build fails due to dependencies:**
   ```bash
   # Clean Docker cache and rebuild
   docker system prune -a
   npm run docker:build
   ```

3. **Container exits immediately:**
   ```bash
   # Check container logs
   docker logs <container-id>
   
   # Run container in interactive mode
   docker run -it salesflow-pro sh
   ```

### Performance Optimization

1. **Multi-stage builds** are used to minimize image size
2. **Non-root user** for security
3. **Health checks** for container orchestration
4. **Proper signal handling** with dumb-init

## 📝 Development Workflow

1. **Local Development:**
   ```bash
   npm run docker:compose:up:dev
   ```

2. **Testing:**
   ```bash
   # Run tests in container
   docker run --rm salesflow-pro npm run test
   ```

3. **Production Build:**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

## 🔒 Security Best Practices

- Uses non-root user (salesflow:nodejs)
- Minimal Alpine Linux base image
- Only production dependencies in final image
- Health checks for monitoring
- Proper signal handling

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

**Need help?** Check the container logs or create an issue in the repository.