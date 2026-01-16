# Load Balancer Deployment Guide

This guide covers deploying the Compliant backend with load balancing for high-availability production environments.

---

## Overview

The Compliant backend is designed to be stateless and load-balancer-ready, making it suitable for horizontal scaling across multiple instances.

### Backend Features for Load Balancing

✅ **Stateless Design** - No server-side session storage  
✅ **JWT Authentication** - Token-based auth works across instances  
✅ **Health Check Endpoint** - `GET /` returns server status  
✅ **CORS Configuration** - Handles cross-origin requests  
✅ **Sticky Sessions Not Required** - Each request is independent  

---

## Architecture Options

### Option 1: NGINX Load Balancer (Recommended)

```
                    ┌──────────────────┐
                    │   NGINX LB       │
                    │   Port 443       │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌────▼──────┐   ┌────▼──────┐
      │ Backend 1 │    │ Backend 2 │   │ Backend 3 │
      │ Port 3001 │    │ Port 3002 │   │ Port 3003 │
      └───────────┘    └───────────┘   └───────────┘
```

### Option 2: AWS Application Load Balancer (ALB)

```
                    ┌──────────────────┐
                    │    AWS ALB       │
                    │  Route 53 DNS    │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌────▼──────┐   ┌────▼──────┐
      │  ECS Task │    │  ECS Task │   │  ECS Task │
      │  Backend  │    │  Backend  │   │  Backend  │
      └───────────┘    └───────────┘   └───────────┘
```

### Option 3: Kubernetes with Ingress

```
                    ┌──────────────────┐
                    │  K8s Ingress     │
                    │  (nginx/traefik) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Service        │
                    │   (ClusterIP)    │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌────▼──────┐   ┌────▼──────┐
      │   Pod 1   │    │   Pod 2   │   │   Pod 3   │
      │  Backend  │    │  Backend  │   │  Backend  │
      └───────────┘    └───────────┘   └───────────┘
```

---

## 1. NGINX Load Balancer Setup

### Prerequisites

- Multiple backend servers (VMs or containers)
- NGINX installed on load balancer server
- SSL certificate (Let's Encrypt recommended)

### Step 1: Deploy Backend Instances

Deploy the backend on multiple servers:

```bash
# On each backend server (server1, server2, server3)
cd /home/runner/work/Compliant-/Compliant-/backend
npm install
PORT=3001 JWT_SECRET=<your-secret> npm start
```

### Step 2: Configure NGINX

Create `/etc/nginx/conf.d/compliant-lb.conf`:

```nginx
# Upstream backend servers
upstream compliant_backend {
    # Least connections load balancing algorithm
    least_conn;
    
    # Backend instances
    server 10.0.1.10:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3001 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name api.compliant.team;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.compliant.team;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.compliant.team/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.compliant.team/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/compliant-access.log;
    error_log /var/log/nginx/compliant-error.log;
    
    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;
    
    # Proxy settings
    location / {
        proxy_pass http://compliant_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://compliant_backend/;
    }
}
```

### Step 3: Enable and Test

```bash
# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Monitor logs
sudo tail -f /var/log/nginx/compliant-access.log
```

### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.compliant.team

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 2. AWS Application Load Balancer Setup

### Prerequisites

- AWS Account
- EC2 instances or ECS cluster
- VPC with public subnets

### Step 1: Create Target Group

```bash
aws elbv2 create-target-group \
  --name compliant-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxx \
  --health-check-enabled \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

### Step 2: Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name compliant-backend-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

### Step 3: Create Listener

```bash
# HTTP Listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# HTTPS Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 4: Register Targets

```bash
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxx Id=i-yyyyy Id=i-zzzzz
```

### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Compliant Backend with ALB

Resources:
  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: compliant-backend-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: compliant-backend-tg
      Port: 3001
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  # HTTPS Listener
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref Certificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # HTTP Listener (redirect to HTTPS)
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301
```

---

## 3. Kubernetes Deployment

### Step 1: Create Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliant-backend
  labels:
    app: compliant-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: compliant-backend
  template:
    metadata:
      labels:
        app: compliant-backend
    spec:
      containers:
      - name: backend
        image: compliant/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: compliant-secrets
              key: jwt-secret
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Step 2: Create Service

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: compliant-backend-service
spec:
  selector:
    app: compliant-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

### Step 3: Create Ingress

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: compliant-backend-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.compliant.team
    secretName: compliant-tls
  rules:
  - host: api.compliant.team
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: compliant-backend-service
            port:
              number: 80
```

### Step 4: Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic compliant-secrets \
  --from-literal=jwt-secret=<your-secret>

# Apply configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods
kubectl get services
kubectl get ingress

# Scale replicas
kubectl scale deployment compliant-backend --replicas=5

# Monitor
kubectl logs -f deployment/compliant-backend
```

---

## 4. Docker Compose with HAProxy

For development or small deployments:

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend1:
    build: ./backend
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    networks:
      - backend-network

  backend2:
    build: ./backend
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    networks:
      - backend-network

  backend3:
    build: ./backend
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    networks:
      - backend-network

  haproxy:
    image: haproxy:2.8
    ports:
      - "443:443"
      - "80:80"
      - "8404:8404"  # Stats page
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
      - ./certs:/etc/ssl/certs:ro
    networks:
      - backend-network
    depends_on:
      - backend1
      - backend2
      - backend3

networks:
  backend-network:
    driver: bridge
```

### haproxy.cfg

```haproxy
global
    log stdout format raw local0
    maxconn 4096

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

# Stats page
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if TRUE

# Frontend
frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/compliant.pem
    
    # Redirect HTTP to HTTPS
    redirect scheme https code 301 if !{ ssl_fc }
    
    # Security headers
    http-response set-header Strict-Transport-Security "max-age=31536000"
    http-response set-header X-Frame-Options "SAMEORIGIN"
    http-response set-header X-Content-Type-Options "nosniff"
    
    default_backend backend-servers

# Backend
backend backend-servers
    balance roundrobin
    option httpchk GET /
    http-check expect status 200
    
    server backend1 backend1:3001 check inter 2000 rise 2 fall 3
    server backend2 backend2:3001 check inter 2000 rise 2 fall 3
    server backend3 backend3:3001 check inter 2000 rise 2 fall 3
```

---

## 5. Monitoring and Observability

### Health Checks

The backend provides a health check endpoint:

```bash
curl https://api.compliant.team/
# Response: "OK" with status 200
```

### NGINX Monitoring

```bash
# Enable NGINX stub_status module
location /nginx_status {
    stub_status;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### Prometheus Metrics (Optional Enhancement)

Add to backend for detailed metrics:

```javascript
// backend/server.js
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### Grafana Dashboard

Monitor key metrics:
- Request rate
- Response time
- Error rate
- Active connections
- Instance health

---

## 6. Auto-Scaling Configuration

### AWS Auto Scaling

```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name compliant-backend-asg \
  --launch-template LaunchTemplateId=lt-xxxxx \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3 \
  --target-group-arns arn:aws:elasticloadbalancing:... \
  --health-check-type ELB \
  --health-check-grace-period 300

# Create scaling policies
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name compliant-backend-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://scale-up.json
```

### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: compliant-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: compliant-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 7. Best Practices

### Backend Configuration

✅ **Environment Variables** - Use secrets management  
✅ **Graceful Shutdown** - Handle SIGTERM properly  
✅ **Connection Pooling** - Add database connection pooling  
✅ **Logging** - Use structured logging (JSON)  
✅ **Monitoring** - Instrument with metrics  

### Load Balancer Configuration

✅ **Health Checks** - Configure appropriate intervals  
✅ **Session Affinity** - Not required (stateless)  
✅ **SSL/TLS** - Use strong ciphers  
✅ **Rate Limiting** - Protect against abuse  
✅ **Timeouts** - Set appropriate values  

### Security

✅ **HTTPS Only** - Redirect HTTP to HTTPS  
✅ **Security Headers** - HSTS, CSP, X-Frame-Options  
✅ **DDoS Protection** - Use CloudFlare or AWS Shield  
✅ **WAF** - Web Application Firewall  
✅ **IP Whitelisting** - For admin endpoints  

---

## 8. Troubleshooting

### Backend Instance Not Responding

```bash
# Check backend health
curl http://backend-ip:3001/

# Check logs
journalctl -u compliant-backend -f

# Check resources
top
df -h
```

### Load Balancer Issues

```bash
# NGINX - Check error logs
sudo tail -f /var/log/nginx/error.log

# Test backend connectivity
curl -v http://backend-ip:3001/

# Verify DNS
nslookup api.compliant.team
```

### High Latency

1. Check backend response times
2. Verify network connectivity
3. Review database queries
4. Check resource utilization
5. Add caching layer (Redis)

---

## Summary

The Compliant backend is ready for load-balanced production deployment:

✅ **Stateless design** - No sticky sessions required  
✅ **Health check endpoint** - `GET /` for monitoring  
✅ **JWT authentication** - Works across all instances  
✅ **Horizontal scaling** - Add more instances as needed  

Choose the deployment option that fits your infrastructure:
- **NGINX** - Simple, flexible, cost-effective
- **AWS ALB** - Managed, auto-scaling, integrated with AWS
- **Kubernetes** - Container orchestration, advanced features
- **Docker Compose** - Development and small deployments

For production heavy-duty environments, remember to also:
1. Migrate from in-memory storage to PostgreSQL/MongoDB
2. Add Redis for caching
3. Implement proper monitoring and alerting
4. Set up automated backups and disaster recovery
