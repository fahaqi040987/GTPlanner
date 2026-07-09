# GTPlanner Docker Setup

🐳 Complete Docker deployment setup for GTPlanner with development and production configurations.

## 🚀 Quick Start

### Development
```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start development environment
./scripts/docker-start.sh start-dev

# Access services
# Frontend: http://localhost:5173
# Backend: http://localhost:11211
# Nginx: http://localhost:8080
```

### Production
```bash
# Create production environment
cp .env.example .env.prod
# Edit .env.prod with production values

# Start production
./scripts/docker-start.sh start-prod

# Access services
# HTTPS: https://localhost
# Backend: http://localhost:11211
# Frontend: http://localhost:3000
```

## 📁 File Structure

```
gtplanner/
├── docker-compose.yml              # Development configuration
├── docker-compose.prod.yml          # Production configuration
├── Dockerfile                      # Production backend image
├── Dockerfile.dev                  # Development backend image
├── scripts/
│   └── docker-start.sh            # Docker management script
├── nginx/
│   ├── nginx.dev.conf            # Development nginx config
│   ├── nginx.prod.conf           # Production nginx config
│   └── ssl/                      # SSL certificates
├── database/
│   ├── init/                     # Database initialization scripts
│   │   ├── 01-init.sh           # Extensions and schemas
│   │   ├── 02-tables.sql        # Tables and indexes
│   │   └── 03-sample-data.sql   # Sample data
│   └── backups/                  # Database backups
└── web/
    ├── Dockerfile               # Production frontend image
    ├── Dockerfile.dev           # Development frontend image
    └── nginx.conf               # Frontend nginx config
```

## 🛠️ Services

### Development Environment

| Service | Description | Port | URL |
|---------|-------------|------|-----|
| **Frontend** | Vite dev server with HMR | 5173 | http://localhost:5173 |
| **Backend** | FastAPI with auto-reload | 11211 | http://localhost:11211 |
| **Database** | PostgreSQL 15 | 5432 | postgresql://gtplanner:gtplanner_dev_pass@db:5432/gtplanner_db |
| **Nginx** | Reverse proxy | 8080 | http://localhost:8080 |

### Production Environment

| Service | Description | Port | URL |
|---------|-------------|------|-----|
| **Frontend** | Optimized static files | 3000 | http://localhost:3000 |
| **Backend** | Production FastAPI | 11211 | http://localhost:11211 |
| **Database** | PostgreSQL with optimizations | 5432 | postgresql://gtplanner:password@db:5432/gtplanner_db |
| **Nginx** | SSL reverse proxy | 80, 443 | https://localhost |

## 🔧 Configuration

### Environment Variables

Create a `.env` file with these variables:

```bash
# Required
LLM_API_KEY=your_api_key_here
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-database-password

# Optional
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4
JINA_API_KEY=your_jina_api_key
VECTOR_SERVICE_BASE_URL=http://localhost:8080
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Docker Commands

```bash
# Start development
./scripts/docker-start.sh start-dev

# Start production
./scripts/docker-start.sh start-prod

# View logs
./scripts/docker-start.sh logs

# Check status
./scripts/docker-start.sh status

# Restart services
./scripts/docker-start.sh restart

# Stop services
./scripts/docker-start.sh stop

# Clean everything (removes volumes)
./scripts/docker-start.sh clean
```

### Manual Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Execute commands
docker-compose exec backend python -m pytest
docker-compose exec db psql -U gtplanner -d gtplanner_db

# Restart service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=2
```

## 🔐 Security

### Production Security Features

- **SSL/TLS**: HTTPS with certificates
- **Non-root containers**: Run as non-privileged users
- **Security headers**: CSP, XSS protection, frame options
- **Rate limiting**: API rate limiting
- **Network isolation**: Custom Docker networks
- **Secrets management**: Environment variable protection

### SSL Setup

```bash
# Generate self-signed certificates
openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem -days 365 -nodes \
  -subj "/CN=localhost"

# Or use Let's Encrypt for production
sudo certbot certonly --standalone -d yourdomain.com
```

## 💾 Database

### Initialization

Database is automatically initialized with:
1. **Extensions**: uuid-ossp, pg_trgm, btree_gin
2. **Schemas**: gtplanner, gtplanner_auth, gtplanner_audit
3. **Tables**: users, workspaces, prds, activity_logs
4. **Indexes**: Performance-optimized indexes
5. **Sample Data**: Development sample data

### Backup and Restore

```bash
# Backup
docker-compose exec db pg_dump -U gtplanner gtplanner_db > backup.sql

# Restore
docker-compose exec -T db psql -U gtplanner gtplanner_db < backup.sql

# Automated backups
docker-compose exec db pg_dump -U gtplanner gtplanner_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Database Access

```bash
# Connect to database
docker-compose exec db psql -U gtplanner -d gtplanner_db

# From host
psql postgresql://gtplanner:gtplanner_dev_pass@localhost:5432/gtplanner_db
```

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:11211/health

# Frontend health
curl http://localhost:5173/

# Nginx health
curl http://localhost:8080/health

# Docker health status
docker-compose ps
docker inspect <container-id> | grep -A 10 Health
```

### Logs

```bash
# All logs
docker-compose logs

# Service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Export logs
docker-compose logs > logs_$(date +%Y%m%d).txt
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :11211

# Kill the process
kill -9 <PID>
```

**Database connection issues**
```bash
# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

**Container won't start**
```bash
# Check logs
docker-compose logs <service-name>

# Rebuild container
docker-compose up -d --build <service-name>
```

**Memory issues**
```bash
# Check resource usage
docker stats

# Increase Docker memory limits
# Docker Desktop > Settings > Resources > Memory
```

## 📚 Additional Documentation

- [Complete Deployment Guide](../docs/DOCKER_DEPLOYMENT.md)
- [Development Guide](../docs/DEVELOPMENT.md)
- [API Documentation](http://localhost:11211/docs)
- [GTPlanner Documentation](../README.md)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [GTPlanner Docs](https://docs.gtplanner.io)
- **Community**: [Discord](https://discord.gg/gtplanner)

## 📝 License

MIT License - see LICENSE file for details

---

**Version**: 1.0.0  
**Last Updated**: 2025-06-29  
**Docker Compose**: 3.8  
**Docker**: 20.10+