# Kubernetes Deployment for Azure AKS

This directory contains Kubernetes manifests for deploying the Compliant Platform to Azure Kubernetes Service (AKS).

## Prerequisites

1. **Azure CLI** installed and configured
2. **kubectl** installed
3. **Azure Container Registry (ACR)** with the application images
4. **Azure Database for PostgreSQL** set up
5. **Azure Cache for Redis** configured
6. **Azure Storage Account** for blob storage

## Quick Start

### 1. Create AKS Cluster

```bash
# Create resource group
az group create --name compliant-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group compliant-rg \
  --name compliant-aks \
  --node-count 3 \
  --vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr compliantacr

# Get credentials
az aks get-credentials --resource-group compliant-rg --name compliant-aks
```

### 2. Create Secrets

Create Kubernetes secrets with your connection strings:

```bash
# Create secrets
kubectl create secret generic compliant-secrets \
  --from-literal=database-url="postgresql://user:password@compliant-postgres.postgres.database.azure.com:5432/compliant_prod?sslmode=require" \
  --from-literal=redis-url="redis://:REDIS_KEY@compliant-redis.redis.cache.windows.net:6380?ssl=true" \
  --from-literal=azure-storage-connection="DefaultEndpointsProtocol=https;AccountName=compliantstorage;AccountKey=KEY;EndpointSuffix=core.windows.net" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=jwt-refresh-secret="$(openssl rand -base64 32)" \
  --namespace compliant
```

### 3. Deploy Application

```bash
# Apply all manifests
kubectl apply -f deployment.yaml

# Check deployment status
kubectl get all -n compliant

# Get external IP
kubectl get service compliant-backend -n compliant
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n compliant

# View logs
kubectl logs -f deployment/compliant-backend -n compliant

# Test health endpoint
EXTERNAL_IP=$(kubectl get service compliant-backend -n compliant -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/api/health/liveness
```

## Manifest Files

### deployment.yaml

Contains all the necessary Kubernetes resources:

- **Namespace**: Isolates the application
- **ConfigMap**: Non-sensitive configuration
- **Secret**: Sensitive data (to be created manually)
- **Deployment**: Application deployment with 3 replicas
- **Service**: LoadBalancer service for external access
- **HorizontalPodAutoscaler**: Auto-scaling based on CPU/memory
- **Ingress**: TLS termination and custom domain
- **NetworkPolicy**: Network security rules
- **PodDisruptionBudget**: High availability guarantee

## Configuration

### Environment Variables

**ConfigMap** (`compliant-config`):
- `NODE_ENV`: Production environment
- `PORT`: Application port (3001)
- `STORAGE_PROVIDER`: Azure Blob Storage
- `JWT_EXPIRATION`: Token expiration time
- `CORS_ORIGIN`: Allowed origins

**Secret** (`compliant-secrets`):
- `database-url`: PostgreSQL connection string
- `redis-url`: Redis connection string
- `azure-storage-connection`: Azure Storage connection string
- `jwt-secret`: JWT signing secret
- `jwt-refresh-secret`: JWT refresh token secret

### Resource Limits

Each pod is configured with:
- **Requests**: 512Mi memory, 250m CPU
- **Limits**: 1Gi memory, 500m CPU

### Auto-Scaling

- **Min replicas**: 3
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

## Monitoring

### View Logs

```bash
# All pods
kubectl logs -f deployment/compliant-backend -n compliant

# Specific pod
kubectl logs -f <pod-name> -n compliant

# Previous pod instance
kubectl logs --previous <pod-name> -n compliant
```

### Check Pod Status

```bash
# Get pods
kubectl get pods -n compliant

# Describe pod
kubectl describe pod <pod-name> -n compliant

# Get events
kubectl get events -n compliant --sort-by='.lastTimestamp'
```

### Exec into Pod

```bash
kubectl exec -it <pod-name> -n compliant -- /bin/sh
```

## Scaling

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment compliant-backend --replicas=5 -n compliant
```

### Check HPA Status

```bash
kubectl get hpa compliant-backend-hpa -n compliant
```

## Updates and Rollouts

### Update Image

```bash
# Update image
kubectl set image deployment/compliant-backend \
  backend=compliantacr.azurecr.io/compliant-backend:v2.0.0 \
  -n compliant

# Check rollout status
kubectl rollout status deployment/compliant-backend -n compliant
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/compliant-backend -n compliant

# Rollback to specific revision
kubectl rollout undo deployment/compliant-backend --to-revision=2 -n compliant
```

### View Rollout History

```bash
kubectl rollout history deployment/compliant-backend -n compliant
```

## Database Migrations

Run database migrations from a pod:

```bash
# Get pod name
POD_NAME=$(kubectl get pods -n compliant -l app=compliant-backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -it $POD_NAME -n compliant -- sh -c "cd packages/backend && npx prisma migrate deploy"
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n compliant

# Check logs
kubectl logs <pod-name> -n compliant

# Common issues:
# - Image pull errors: Check ACR credentials
# - Crash loop: Check application logs
# - Resource limits: Check CPU/memory usage
```

### Service Not Accessible

```bash
# Check service
kubectl get service compliant-backend -n compliant

# Check endpoints
kubectl get endpoints compliant-backend -n compliant

# Check ingress
kubectl describe ingress compliant-ingress -n compliant
```

### Database Connection Issues

```bash
# Test database connection from pod
kubectl exec -it <pod-name> -n compliant -- sh -c "apt-get update && apt-get install -y postgresql-client && psql \$DATABASE_URL"

# Common issues:
# - Firewall rules: Allow AKS cluster IP range
# - SSL mode: Ensure ?sslmode=require in connection string
# - Credentials: Verify username and password
```

## Security Best Practices

1. **Use Managed Identity**: Attach managed identity to AKS for ACR access
2. **Network Policies**: Enabled by default in deployment.yaml
3. **Pod Security**: Consider using Pod Security Policies or Azure Policy
4. **Secrets Management**: Use Azure Key Vault for sensitive data
5. **RBAC**: Implement Role-Based Access Control for kubectl access

## Clean Up

```bash
# Delete all resources
kubectl delete -f deployment.yaml

# Or delete namespace
kubectl delete namespace compliant

# Delete AKS cluster
az aks delete --resource-group compliant-rg --name compliant-aks --yes
```

## Integration with Azure Services

### Azure Application Gateway Ingress Controller (AGIC)

The ingress is configured for Azure Application Gateway:

```yaml
annotations:
  kubernetes.io/ingress.class: azure/application-gateway
```

### Azure Monitor Integration

Enable Azure Monitor for containers:

```bash
az aks enable-addons \
  --resource-group compliant-rg \
  --name compliant-aks \
  --addons monitoring
```

### Azure Key Vault Integration

Use Azure Key Vault Provider for Secrets Store CSI Driver:

```bash
az aks enable-addons \
  --resource-group compliant-rg \
  --name compliant-aks \
  --addons azure-keyvault-secrets-provider
```

## Cost Optimization

- **Use spot instances** for non-critical workloads
- **Enable cluster autoscaler** to scale nodes based on demand
- **Right-size node pools** based on actual usage
- **Use Azure Reserved Instances** for long-term deployments

## Additional Resources

- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Application Gateway Ingress Controller](https://docs.microsoft.com/en-us/azure/application-gateway/ingress-controller-overview)
