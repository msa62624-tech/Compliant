# Azure Deployment Guide - Compliant Platform

## Overview

The Compliant Insurance Tracking Platform is **fully compatible with Microsoft Azure** cloud services. This guide provides comprehensive instructions for deploying the application to Azure using various deployment options.

## ✅ Azure Compatibility

The application is compatible with Azure through:

1. **Container-based Deployment**: Docker images can be deployed to Azure Container Instances, Azure App Service, or Azure Kubernetes Service
2. **Database**: PostgreSQL can be hosted on Azure Database for PostgreSQL
3. **File Storage**: Azure Blob Storage support (via configuration)
4. **Caching**: Redis via Azure Cache for Redis
5. **Email Services**: Azure Communication Services or third-party providers (SendGrid, etc.)
6. **Monitoring**: Azure Application Insights integration
7. **CI/CD**: Azure DevOps Pipelines or GitHub Actions

## 🏗️ Architecture on Azure

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud                              │
│                                                               │
│  ┌─────────────────────┐      ┌──────────────────────┐      │
│  │  Azure App Service  │      │  Azure Container     │      │
│  │  (Web Apps)         │  OR  │  Instances / AKS     │      │
│  │  - Frontend         │      │  - Frontend + Backend│      │
│  │  - Backend API      │      │                      │      │
│  └──────────┬──────────┘      └──────────┬───────────┘      │
│             │                             │                  │
│             └────────────┬────────────────┘                  │
│                          │                                   │
│        ┌─────────────────┼───────────────────┐              │
│        │                 │                   │              │
│  ┌─────▼──────┐   ┌─────▼──────┐   ┌───────▼────────┐     │
│  │  Azure DB  │   │   Azure    │   │  Azure Cache   │     │
│  │  PostgreSQL│   │ Blob Storage│   │   for Redis    │     │
│  └────────────┘   └────────────┘   └────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Azure Monitor / Application Insights            │      │
│  └──────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Options

### Option 1: Azure App Service (Recommended for Quick Start)

Azure App Service is a fully managed platform for building, deploying, and scaling web apps.

#### Prerequisites
- Azure CLI installed: `az login`
- Docker (for container deployment)

#### Steps

1. **Create Resource Group**
```bash
az group create \
  --name compliant-rg \
  --location eastus
```

2. **Create Azure Database for PostgreSQL**
```bash
az postgres flexible-server create \
  --resource-group compliant-rg \
  --name compliant-postgres \
  --location eastus \
  --admin-user compliantadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B2s \
  --version 15 \
  --storage-size 32
```

3. **Create Azure Cache for Redis**
```bash
az redis create \
  --resource-group compliant-rg \
  --name compliant-redis \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

4. **Create Azure Storage Account (for Blob Storage)**
```bash
az storage account create \
  --name compliantstorage \
  --resource-group compliant-rg \
  --location eastus \
  --sku Standard_LRS

# Create container for file storage
az storage container create \
  --name documents \
  --account-name compliantstorage \
  --public-access off
```

5. **Build and Push Docker Image to Azure Container Registry**
```bash
# Create Container Registry
az acr create \
  --resource-group compliant-rg \
  --name compliantacr \
  --sku Basic

# Login to ACR
az acr login --name compliantacr

# Build and push backend
docker build -t compliantacr.azurecr.io/compliant-backend:latest .
docker push compliantacr.azurecr.io/compliant-backend:latest
```

6. **Create App Service Plan**
```bash
az appservice plan create \
  --name compliant-plan \
  --resource-group compliant-rg \
  --is-linux \
  --sku B2
```

7. **Create Web App for Backend**
```bash
az webapp create \
  --resource-group compliant-rg \
  --plan compliant-plan \
  --name compliant-backend \
  --deployment-container-image-name compliantacr.azurecr.io/compliant-backend:latest
```

8. **Configure Environment Variables**
```bash
# Get connection strings
POSTGRES_CONN=$(az postgres flexible-server show-connection-string \
  --server-name compliant-postgres \
  --database-name compliant_prod \
  --admin-user compliantadmin \
  --admin-password 'YourSecurePassword123!' \
  --query connectionStrings.jdbc \
  --output tsv)

REDIS_CONN=$(az redis show \
  --name compliant-redis \
  --resource-group compliant-rg \
  --query hostName \
  --output tsv)

REDIS_KEY=$(az redis list-keys \
  --name compliant-redis \
  --resource-group compliant-rg \
  --query primaryKey \
  --output tsv)

STORAGE_CONN=$(az storage account show-connection-string \
  --name compliantstorage \
  --resource-group compliant-rg \
  --output tsv)

# Set environment variables
az webapp config appsettings set \
  --resource-group compliant-rg \
  --name compliant-backend \
  --settings \
    DATABASE_URL="postgresql://compliantadmin:YourSecurePassword123!@compliant-postgres.postgres.database.azure.com:5432/compliant_prod?sslmode=require" \
    REDIS_URL="redis://:${REDIS_KEY}@${REDIS_CONN}:6380?ssl=true" \
    STORAGE_PROVIDER="azure" \
    AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONN}" \
    AZURE_STORAGE_CONTAINER="documents" \
    JWT_SECRET="$(openssl rand -base64 32)" \
    JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
    NODE_ENV="production" \
    PORT="8080"
```

9. **Run Database Migrations**
```bash
# Connect to the web app and run migrations
az webapp ssh --resource-group compliant-rg --name compliant-backend
# Inside the container:
cd packages/backend && npx prisma migrate deploy
```

10. **Deploy Frontend to Azure Static Web Apps** (Optional)
```bash
az staticwebapp create \
  --name compliant-frontend \
  --resource-group compliant-rg \
  --source https://github.com/your-username/compliant \
  --location eastus \
  --branch main \
  --app-location "packages/frontend" \
  --output-location ".next"
```

### Option 2: Azure Container Instances (ACI)

For simpler container deployments without orchestration.

```bash
# Create container group with backend
az container create \
  --resource-group compliant-rg \
  --name compliant-backend \
  --image compliantacr.azurecr.io/compliant-backend:latest \
  --cpu 2 \
  --memory 4 \
  --registry-login-server compliantacr.azurecr.io \
  --registry-username $(az acr credential show --name compliantacr --query username -o tsv) \
  --registry-password $(az acr credential show --name compliantacr --query passwords[0].value -o tsv) \
  --dns-name-label compliant-api \
  --ports 3001 \
  --environment-variables \
    DATABASE_URL="postgresql://..." \
    REDIS_URL="redis://..." \
    STORAGE_PROVIDER="azure" \
    AZURE_STORAGE_CONNECTION_STRING="..." \
    AZURE_STORAGE_CONTAINER="documents" \
    NODE_ENV="production"
```

### Option 3: Azure Kubernetes Service (AKS)

For production deployments with auto-scaling and high availability.

#### 1. Create AKS Cluster
```bash
az aks create \
  --resource-group compliant-rg \
  --name compliant-aks \
  --node-count 2 \
  --vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr compliantacr
```

#### 2. Get Credentials
```bash
az aks get-credentials \
  --resource-group compliant-rg \
  --name compliant-aks
```

#### 3. Create Kubernetes Manifests

**`k8s/backend-deployment.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: compliant-backend
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
        image: compliantacr.azurecr.io/compliant-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: compliant-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: compliant-secrets
              key: redis-url
        - name: STORAGE_PROVIDER
          value: "azure"
        - name: AZURE_STORAGE_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: compliant-secrets
              key: azure-storage-connection
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health/liveness
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/readiness
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: compliant-backend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: compliant-backend
```

#### 4. Create Secrets
```bash
kubectl create secret generic compliant-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=azure-storage-connection="..." \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=jwt-refresh-secret="$(openssl rand -base64 32)"
```

#### 5. Deploy
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

#### 6. Get External IP
```bash
kubectl get service compliant-backend
```

## 🔐 Azure Security Best Practices

### 1. Use Azure Key Vault for Secrets
```bash
# Create Key Vault
az keyvault create \
  --name compliant-kv \
  --resource-group compliant-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name compliant-kv \
  --name database-url \
  --value "postgresql://..."

az keyvault secret set \
  --vault-name compliant-kv \
  --name jwt-secret \
  --value "$(openssl rand -base64 32)"
```

### 2. Enable Azure AD Authentication
```bash
# Enable AD authentication for PostgreSQL
az postgres flexible-server ad-admin create \
  --resource-group compliant-rg \
  --server-name compliant-postgres \
  --display-name "Compliant Admin" \
  --object-id <your-ad-object-id>
```

### 3. Configure Network Security
```bash
# Create Virtual Network
az network vnet create \
  --resource-group compliant-rg \
  --name compliant-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name app-subnet \
  --subnet-prefix 10.0.1.0/24

# Configure firewall rules for PostgreSQL
az postgres flexible-server firewall-rule create \
  --resource-group compliant-rg \
  --name compliant-postgres \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## 📊 Azure Monitoring and Logging

### 1. Enable Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app compliant-insights \
  --location eastus \
  --resource-group compliant-rg

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app compliant-insights \
  --resource-group compliant-rg \
  --query instrumentationKey \
  --output tsv)

# Add to app settings
az webapp config appsettings set \
  --resource-group compliant-rg \
  --name compliant-backend \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=${INSTRUMENTATION_KEY}"
```

### 2. Configure Log Analytics
```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group compliant-rg \
  --workspace-name compliant-logs \
  --location eastus
```

## 💰 Azure Cost Optimization

### Development/Staging Environment
- **App Service**: Basic tier (B1) - ~$13/month
- **PostgreSQL**: Burstable tier (B1ms) - ~$12/month
- **Redis**: Basic C0 - ~$16/month
- **Storage**: Standard LRS - ~$0.02/GB/month
- **Total**: ~$50/month

### Production Environment
- **App Service**: Standard tier (S2) - ~$146/month
- **PostgreSQL**: General Purpose (D2s_v3) - ~$150/month
- **Redis**: Standard C1 - ~$76/month
- **Storage**: Standard LRS with CDN - ~$50/month
- **Application Insights**: Pay-as-you-go - ~$50/month
- **Total**: ~$472/month

## 🔄 CI/CD with Azure DevOps

### Azure Pipeline Configuration

**`azure-pipelines.yml`**
```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  containerRegistry: 'compliantacr.azurecr.io'
  imageRepository: 'compliant-backend'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: Build and Push
  jobs:
  - job: Build
    steps:
    - task: Docker@2
      displayName: Build and push image
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(containerRegistry)
        tags: |
          $(tag)
          latest

- stage: Deploy
  displayName: Deploy to Azure
  dependsOn: Build
  jobs:
  - deployment: Deploy
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            inputs:
              azureSubscription: 'Azure Service Connection'
              appName: 'compliant-backend'
              containers: '$(containerRegistry)/$(imageRepository):$(tag)'
```

## 🌐 Domain and SSL Configuration

### 1. Configure Custom Domain
```bash
# Add custom domain to App Service
az webapp config hostname add \
  --webapp-name compliant-backend \
  --resource-group compliant-rg \
  --hostname api.compliant.com

# Enable SSL
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name compliant-backend \
  --resource-group compliant-rg
```

### 2. Use Azure Front Door (CDN + WAF)
```bash
# Create Front Door
az network front-door create \
  --resource-group compliant-rg \
  --name compliant-fd \
  --backend-address compliant-backend.azurewebsites.net
```

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Azure Kubernetes Service (AKS)](https://docs.microsoft.com/en-us/azure/aks/)
- [Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure SSL is enabled: `?sslmode=require` in connection string
   - Check firewall rules: Allow Azure services
   - Verify credentials and permissions

2. **Container Registry Authentication**
   - Use managed identity when possible
   - Verify ACR credentials are correct
   - Check App Service has pull permissions

3. **Environment Variables Not Loading**
   - Verify all required variables are set
   - Check for typos in variable names
   - Restart the app after setting variables

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend API is accessible
- [ ] Database connection is working
- [ ] Redis cache is connected
- [ ] File uploads work (Azure Blob Storage)
- [ ] Email service is configured
- [ ] SSL/TLS is enabled
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Auto-scaling is set up (if needed)
- [ ] Cost alerts are configured

## 🎯 Next Steps

1. Configure production environment variables
2. Set up automated backups
3. Configure monitoring and alerts
4. Implement auto-scaling policies
5. Set up disaster recovery
6. Configure WAF rules
7. Implement rate limiting
8. Set up log aggregation
9. Configure performance monitoring
10. Document runbook for operations

---

**Note**: This guide provides various Azure deployment options. Choose the one that best fits your requirements and budget. For production deployments, consider using Infrastructure as Code (Terraform or ARM templates) for reproducible deployments.
