# DATAPROTECT Platform - Production Deployment Guide

## 📋 Overview

This guide covers deploying a complete CTF platform with Docker orchestration, similar to TryHackMe/HackTheBox, ready for production use and Open edX integration.

## 🏗️ Architecture

### Components

1. **Backend API** (Node.js + Express + SQLite)
   - RESTful API for all platform operations
   - Docker SDK integration for container orchestration
   - JWT authentication with role-based access control
   - Automatic container cleanup and monitoring

2. **Admin Panel** (React + TypeScript + Tailwind)
   - Challenge and category management
   - Docker image configuration per challenge
   - User management
   - Real-time container monitoring
   - Submission tracking

3. **User Frontend** (HTML + JavaScript)
   - Challenge browsing by category
   - Docker machine start/stop functionality
   - Real-time timer and IP display
   - Flag submission interface
   - Leaderboard

## 🚀 Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB+ recommended
- **Storage**: 50GB+ SSD
- **Docker**: Version 20.10+
- **Node.js**: Version 18+ LTS
- **Database**: SQLite (included) or PostgreSQL for production scale

### Network Requirements

- Public IP address or domain name
- Ports to expose:
  - `80/443`: Frontend (HTTPS recommended)
  - `5000`: Backend API
  - `Dynamic ports`: Docker containers (configure firewall rules)

## 📦 Installation Steps

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker ps
```

### 2. Deploy Backend

```bash
# Extract backend files
cd /opt
sudo tar -xzf dataprotect-backend.tar.gz
cd dataprotect-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

**Edit `.env` file:**

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=https://yourdomain.com
DATABASE_PATH=./database/ctf.db
```

**Important**: Change `JWT_SECRET` to a strong random string!

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Initialize Database

```bash
# Run database initialization
npm run init-db

# Apply Docker schema
sqlite3 database/ctf.db < database/docker_schema.sql

# Verify tables
sqlite3 database/ctf.db ".tables"
```

### 4. Configure Docker Network

The backend automatically creates a Docker network named `ctf-network` for isolated container communication. Ensure Docker daemon is running:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 5. Setup Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start server.js --name dataprotect-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command output instructions
```

### 6. Deploy Frontend

```bash
# Copy frontend files
sudo mkdir -p /var/www/dataprotect
sudo cp -r ~/dataprotect-frontend/* /var/www/dataprotect/

# Update API URL in config.js
sudo nano /var/www/dataprotect/config.js
```

**Update `BASE_URL` in config.js:**

```javascript
const API_CONFIG = {
    BASE_URL: 'https://api.yourdomain.com/api',  // Your backend URL
    // ... rest of config
};
```

### 7. Configure Nginx (Recommended)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/dataprotect
```

**Nginx configuration:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/dataprotect;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel (if deployed separately)
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dataprotect /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## 🐳 Docker Challenge Setup

### Preparing Challenge Images

#### Option 1: Use Existing Images

```bash
# Pull pre-built vulnerable images
docker pull vulnerables/web-dvwa:latest
docker pull webgoat/webgoat:latest
docker pull bkimminich/juice-shop:latest
```

#### Option 2: Build Custom Images

Create a Dockerfile for your challenge:

```dockerfile
FROM ubuntu:20.04

# Install services
RUN apt-get update && apt-get install -y \
    apache2 \
    php \
    && rm -rf /var/lib/apt/lists/*

# Copy challenge files
COPY ./challenge-files /var/www/html/

# Expose ports
EXPOSE 80

CMD ["apache2ctl", "-D", "FOREGROUND"]
```

Build and tag:

```bash
docker build -t ctf/web-challenge-1:latest .
```

### Configure Challenge in Admin Panel

1. Login to admin panel: `https://admin.yourdomain.com`
2. Navigate to **Docker** section
3. Select a challenge
4. Configure:
   - **Docker Image**: `vulnerables/web-dvwa:latest`
   - **Exposed Ports**: `80, 3306`
   - **Environment Variables**: `MYSQL_ROOT_PASSWORD=password`
   - **Memory Limit**: `512` MB
   - **CPU Shares**: `512`
   - **Timeout**: `3600` seconds (1 hour)
5. Click **Save Configuration**

## 🔧 System Configuration

### Docker Resource Limits

Edit `/etc/docker/daemon.json`:

```json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if not behind Nginx)
sudo ufw allow 5000/tcp

# Allow Docker port range for challenges
sudo ufw allow 10000:20000/tcp

# Enable firewall
sudo ufw enable
```

### Automatic Container Cleanup

Create a cron job to clean expired containers:

```bash
# Edit crontab
crontab -e

# Add cleanup job (every 5 minutes)
*/5 * * * * curl -X POST http://localhost:5000/api/docker/admin/cleanup -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or use a systemd timer (recommended):

```bash
# Create service
sudo nano /etc/systemd/system/docker-cleanup.service
```

```ini
[Unit]
Description=Cleanup expired Docker containers

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST http://localhost:5000/api/docker/admin/cleanup -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

```bash
# Create timer
sudo nano /etc/systemd/system/docker-cleanup.timer
```

```ini
[Unit]
Description=Run Docker cleanup every 5 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

```bash
# Enable timer
sudo systemctl enable docker-cleanup.timer
sudo systemctl start docker-cleanup.timer
```

## 🔐 Security Best Practices

### 1. Database Security

```bash
# Backup database regularly
sudo mkdir -p /backups/dataprotect
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /opt/dataprotect-backend/database/ctf.db /backups/dataprotect/ctf-$(date +\%Y\%m\%d).db
```

### 2. Docker Security

- Use read-only containers when possible
- Limit container resources (CPU, memory)
- Use Docker security scanning: `docker scan image-name`
- Keep Docker images updated

### 3. API Security

- Always use HTTPS in production
- Implement rate limiting (use `express-rate-limit`)
- Enable CORS only for trusted domains
- Regularly rotate JWT secrets

### 4. Admin Access

- Use strong passwords (minimum 12 characters)
- Enable 2FA (future enhancement)
- Limit admin panel access by IP if possible
- Monitor admin actions

## 📊 Monitoring

### Backend Logs

```bash
# View PM2 logs
pm2 logs dataprotect-api

# View Docker logs
docker logs <container-id>
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Monitor Docker resources
docker stats

# Monitor disk usage
df -h
du -sh /var/lib/docker
```

### Setup Prometheus + Grafana (Optional)

For advanced monitoring, integrate Prometheus and Grafana to track:
- Container CPU/Memory usage
- API response times
- Active users and machines
- Challenge solve rates

## 🔗 Open edX Integration

### LTI Configuration (Future Enhancement)

The platform is designed to integrate with Open edX via LTI (Learning Tools Interoperability). 

**Planned features:**
- LTI 1.3 authentication
- Grade passback to Open edX
- Single Sign-On (SSO)
- Course-specific challenges

**Current workaround:**
- Embed frontend in Open edX using iframe
- Use shared authentication token
- Manual grade synchronization

## 🐛 Troubleshooting

### Docker containers won't start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check Docker socket permissions
ls -la /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock  # Temporary fix

# Check logs
docker logs <container-id>
```

### Backend API errors

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dataprotect-api --lines 100

# Restart backend
pm2 restart dataprotect-api
```

### Database locked errors

```bash
# Check database file permissions
ls -la /opt/dataprotect-backend/database/

# Fix permissions
sudo chown -R $USER:$USER /opt/dataprotect-backend/database/
```

### Port conflicts

```bash
# Check what's using a port
sudo lsof -i :5000
sudo netstat -tlnp | grep 5000

# Kill process
sudo kill -9 <PID>
```

## 📈 Scaling Considerations

### For High Traffic

1. **Database**: Migrate from SQLite to PostgreSQL
2. **Load Balancing**: Use Nginx load balancer with multiple backend instances
3. **Container Orchestration**: Consider Kubernetes for large-scale deployments
4. **CDN**: Use Cloudflare or similar for static assets
5. **Caching**: Implement Redis for session management and caching

### Horizontal Scaling

```bash
# Run multiple backend instances
pm2 start server.js -i max --name dataprotect-api

# Configure Nginx upstream
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}
```

## 📞 Support

For issues or questions:
- Check logs first
- Review Docker container status
- Verify network connectivity
- Ensure all services are running

## 🎯 Default Credentials

**Admin Panel:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

## 📝 License & Credits

DATAPROTECT Platform - CTF Training Platform with Docker Orchestration
Built for production use and Open edX integration.

---

**Version**: 1.0.0  
**Last Updated**: November 2025
