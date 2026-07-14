# Deployment Guide

This guide provides instructions for deploying the Professional Network application to production.

## Deployment Options

### Option 1: Traditional Server Deployment

#### Backend Deployment

1. **Build the application**
   ```bash
   mvn clean package -DskipTests
   ```

2. **Copy the JAR file to your server**
   ```bash
   scp target/professional-network-1.0.0.jar user@your-server:/opt/professional-network/
   ```

3. **Set up environment variables on the server**
   ```bash
   export DATABASE_URL=jdbc:mysql://your-db-host:3306/professional_network
   export DATABASE_USERNAME=your_username
   export DATABASE_PASSWORD=your_password
   export JWT_SECRET=your_very_secure_random_secret_key_here
   export JWT_EXPIRATION=86400000
   ```

4. **Run the application**
   ```bash
   java -jar /opt/professional-network/professional-network-1.0.0.jar
   ```

5. **Set up as a systemd service (Linux)**
   
   Create `/etc/systemd/system/professional-network.service`:
   ```ini
   [Unit]
   Description=Professional Network Backend
   After=syslog.target network.target

   [Service]
   User=appuser
   ExecStart=/usr/bin/java -jar /opt/professional-network/professional-network-1.0.0.jar
   SuccessExitStatus=143
   Environment="DATABASE_URL=jdbc:mysql://localhost:3306/professional_network"
   Environment="DATABASE_USERNAME=your_username"
   Environment="DATABASE_PASSWORD=your_password"
   Environment="JWT_SECRET=your_secret"
   Environment="JWT_EXPIRATION=86400000"

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start the service:
   ```bash
   sudo systemctl enable professional-network
   sudo systemctl start professional-network
   ```

#### Frontend Deployment

1. **Build the production bundle**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy using Nginx**
   
   Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```

   Create Nginx configuration `/etc/nginx/sites-available/professional-network`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /var/www/professional-network;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/professional-network /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Copy build files to server**
   ```bash
   sudo mkdir -p /var/www/professional-network
   sudo cp -r build/* /var/www/professional-network/
   ```

### Option 2: Docker Deployment

1. **Create Dockerfile for Backend**
   
   Create `Dockerfile` in project root:
   ```dockerfile
   FROM openjdk:17-jdk-slim
   WORKDIR /app
   COPY target/professional-network-1.0.0.jar app.jar
   EXPOSE 8080
   ENTRYPOINT ["java", "-jar", "app.jar"]
   ```

2. **Create Dockerfile for Frontend**
   
   Create `frontend/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Create docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     mysql:
       image: mysql:8.0
       environment:
         MYSQL_ROOT_PASSWORD: rootpassword
         MYSQL_DATABASE: professional_network
         MYSQL_USER: appuser
         MYSQL_PASSWORD: apppassword
       ports:
         - "3306:3306"
       volumes:
         - mysql_data:/var/lib/mysql

     backend:
       build: .
       depends_on:
         - mysql
       environment:
         DATABASE_URL: jdbc:mysql://mysql:3306/professional_network?createDatabaseIfNotExist=true&useSSL=false
         DATABASE_USERNAME: appuser
         DATABASE_PASSWORD: apppassword
         JWT_SECRET: your_very_secure_random_secret_key
         JWT_EXPIRATION: 86400000
       ports:
         - "8080:8080"

     frontend:
       build: ./frontend
       depends_on:
         - backend
       ports:
         - "80:80"

   volumes:
     mysql_data:
   ```

4. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Option 3: Cloud Deployment (AWS)

#### Backend on AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB application**
   ```bash
   eb init -p java-17 professional-network
   ```

3. **Create environment**
   ```bash
   eb create production
   ```

4. **Set environment variables**
   ```bash
   eb setenv DATABASE_URL=jdbc:mysql://your-rds-endpoint:3306/professional_network \
              DATABASE_USERNAME=admin \
              DATABASE_PASSWORD=yourpassword \
              JWT_SECRET=your_secret \
              JWT_EXPIRATION=86400000
   ```

5. **Deploy**
   ```bash
   mvn clean package -DskipTests
   eb deploy
   ```

#### Frontend on AWS S3 + CloudFront

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   aws s3 mb s3://your-app-bucket
   ```

3. **Upload build files**
   ```bash
   aws s3 sync build/ s3://your-app-bucket
   ```

4. **Configure bucket for static website hosting**
   ```bash
   aws s3 website s3://your-app-bucket --index-document index.html --error-document index.html
   ```

5. **Create CloudFront distribution**
   - Use AWS Console to create a CloudFront distribution
   - Point it to your S3 bucket
   - Configure custom domain and SSL certificate

### Option 4: Heroku Deployment

#### Backend on Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Add MySQL addon**
   ```bash
   heroku addons:create jawsdb:kitefin
   ```

3. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret
   heroku config:set JWT_EXPIRATION=86400000
   ```

4. **Create Procfile**
   ```
   web: java -jar target/professional-network-1.0.0.jar
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

#### Frontend on Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Configure environment variables**
   - Set REACT_APP_API_URL in Netlify dashboard
   - Point it to your Heroku backend URL

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

## Database Migration

### Production Database Setup

1. **Create production database**
   ```sql
   CREATE DATABASE professional_network;
   CREATE USER 'appuser'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON professional_network.* TO 'appuser'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Update application.properties for production**
   ```properties
   spring.jpa.hibernate.ddl-auto=validate
   spring.jpa.show-sql=false
   ```

## Monitoring and Logging

### Application Logging

1. **Configure logging in application.properties**
   ```properties
   logging.level.root=INFO
   logging.level.com.social.network=INFO
   logging.file.name=/var/log/professional-network/application.log
   ```

### Health Checks

Add Spring Boot Actuator for health checks:

1. **Add dependency in pom.xml**
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-actuator</artifactId>
   </dependency>
   ```

2. **Configure actuator endpoints**
   ```properties
   management.endpoints.web.exposure.include=health,info
   management.endpoint.health.show-details=when-authorized
   ```

## Performance Optimization

### Backend

1. **Enable connection pooling**
   ```properties
   spring.datasource.hikari.maximum-pool-size=10
   spring.datasource.hikari.minimum-idle=5
   ```

2. **Enable caching**
   ```properties
   spring.cache.type=caffeine
   ```

### Frontend

1. **Enable production build optimizations** (already included in React)

2. **Configure Nginx caching**
   ```nginx
   location /static {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set strong JWT secret (at least 256 bits)
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Use strong database passwords

## Backup Strategy

1. **Database backups**
   ```bash
   # Daily backup
   mysqldump -u root -p professional_network > backup_$(date +%Y%m%d).sql
   ```

2. **Automated backups with cron**
   ```bash
   0 2 * * * /usr/bin/mysqldump -u root -pPASSWORD professional_network > /backup/db_$(date +\%Y\%m\%d).sql
   ```

## Rollback Procedure

1. **Keep previous versions**
   ```bash
   mv professional-network-1.0.0.jar professional-network-1.0.0.jar.backup
   ```

2. **Quick rollback**
   ```bash
   sudo systemctl stop professional-network
   mv professional-network-1.0.0.jar.backup professional-network-1.0.0.jar
   sudo systemctl start professional-network
   ```

## Support and Maintenance

- Monitor application logs regularly
- Set up automated backups
- Keep dependencies updated
- Monitor server resources
- Set up alerts for errors and downtime
