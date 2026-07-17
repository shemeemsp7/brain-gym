# Brain Gym - Kubernetes Deployment

A scalable Kubernetes deployment for the Brain Gym application with PostgreSQL database, hosted on AWS with Istio service mesh.

## 🏗️ Architecture

- **Frontend**: Next.js React application
- **Backend**: Next.js API routes
- **Database**: PostgreSQL 15 (StatefulSet)
- **Storage**: AWS EBS GP3 (100GB)
- **Service Mesh**: Istio
- **Domain**: brain-gym.example.com

## 📋 Prerequisites

- Kubernetes cluster (EKS recommended)
- Istio service mesh installed
- Existing Istio gateway: `istio-system/istio-gateway-admin`
- AWS Route 53 domain: `example.com`
- kubectl configured for your cluster

## 🗂️ Project Structure

```
kubernets/
├── namespace.yaml                 # Brain Gym namespace with Istio injection
├── configmap.yaml                # Application configuration
├── secrets.yaml                  # Database credentials and API keys
├── storage-class.yaml            # AWS EBS GP3 storage class
├── postgres-pvc.yaml             # PostgreSQL persistent volume (100GB)
├── postgres-deployment.yaml      # PostgreSQL StatefulSet
├── postgres-service.yaml         # PostgreSQL service
├── postgres-init-job.yaml        # Database schema initialization
├── postgres-backup-pvc.yaml      # Backup storage (20GB)
├── postgres-backup-cronjob.yaml  # Automated daily backups
├── postgres-monitoring.yaml      # PostgreSQL metrics exporter
├── app-deployment.yaml           # Brain Gym application deployment
├── app-service.yaml              # Application service
├── virtualservice.yaml           # Istio traffic routing
├── destinationrule.yaml          # Istio traffic policies
├── peer-authentication.yaml      # Istio mTLS configuration
├── rbac.yaml                     # Service account and permissions
├── storage-classes-additional.yaml # Additional storage options
└── deploy.sh                     # Automated deployment script
```

## 🚀 Quick Deployment

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd brain-gym/kubernets
```

### 2. Update Configuration
Edit the following files with your specific values:

**secrets.yaml**:
```bash
# Update OpenAI API key (base64 encoded)
echo -n "your-openai-api-key" | base64
```

**configmap.yaml**:
```yaml
# Verify domain configuration
API_BASE: "https://brain-gym.example.com/api"
NEXT_PUBLIC_API_BASE: "https://brain-gym.example.com"
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Manual Deployment

If you prefer step-by-step deployment:

### 1. Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. Setup Storage
```bash
kubectl apply -f storage-class.yaml
kubectl apply -f storage-classes-additional.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-backup-pvc.yaml
```

### 3. Configure Application
```bash
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f rbac.yaml
```

### 4. Deploy PostgreSQL
```bash
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready --timeout=300s pod/postgres-statefulset-0 -n brain-gym
```

### 5. Initialize Database
```bash
kubectl apply -f postgres-init-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/postgres-init-schema -n brain-gym
```

### 6. Setup Monitoring and Backups
```bash
kubectl apply -f postgres-monitoring.yaml
kubectl apply -f postgres-backup-cronjob.yaml
```

### 7. Deploy Application
```bash
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml

# Wait for application to be ready
kubectl wait --for=condition=available --timeout=300s deployment/brain-gym-deployment -n brain-gym
```

### 8. Configure Istio
```bash
kubectl apply -f virtualservice.yaml
kubectl apply -f destinationrule.yaml
kubectl apply -f peer-authentication.yaml
```

## 🔍 Verification

### Check Deployment Status
```bash
# Check all pods
kubectl get pods -n brain-gym

# Check services
kubectl get services -n brain-gym

# Check Istio configuration
kubectl get virtualservices -n brain-gym
kubectl get destinationrules -n brain-gym

# Check storage
kubectl get pvc -n brain-gym
```

### Test Application
```bash
# Check application health
kubectl port-forward -n brain-gym svc/brain-gym-service 3000:3000
curl http://localhost:3000/api/health

# Check database connectivity
kubectl exec -it postgres-statefulset-0 -n brain-gym -- psql -U postgres -d ascendarium -c "SELECT version();"
```

## 🌐 Access

Once deployed, the application will be available at:
- **URL**: https://brain-gym.example.com
- **API**: https://brain-gym.example.com/api

## 📊 Monitoring

### PostgreSQL Metrics
The deployment includes PostgreSQL exporter for monitoring:
```bash
# Check metrics endpoint
kubectl port-forward -n brain-gym svc/postgres-exporter-service 9187:9187
curl http://localhost:9187/metrics
```

### Application Logs
```bash
# View application logs
kubectl logs -f deployment/brain-gym-deployment -n brain-gym

# View PostgreSQL logs
kubectl logs -f postgres-statefulset-0 -n brain-gym
```

## 💾 Backup & Recovery

### Automated Backups
- **Schedule**: Daily at 2:00 AM UTC
- **Retention**: 7 days
- **Location**: `/backup` in postgres-backup-pvc

### Manual Backup
```bash
# Create manual backup
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d) -n brain-gym
```

### Restore from Backup
```bash
# List available backups
kubectl exec -it postgres-statefulset-0 -n brain-gym -- ls -la /backup

# Restore from backup
kubectl exec -it postgres-statefulset-0 -n brain-gym -- psql -U postgres -d ascendarium < /backup/backup_YYYYMMDD_HHMMSS.sql
```

## 🔧 Configuration

### Environment Variables

**ConfigMap** (`brain-gym-config`):
- `API_BASE`: Internal API base URL
- `NEXT_PUBLIC_API_BASE`: Public API base URL
- `NODE_ENV`: Environment (production)
- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port
- `POSTGRES_DB`: Database name

**Secrets** (`brain-gym-secrets`):
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `DATABASE_URL`: Full database connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features

### Storage Configuration

| Component | Storage Class | Size | Performance | Reclaim Policy |
|-----------|---------------|------|-------------|----------------|
| PostgreSQL Data | ebs-gp3 | 100Gi | 3,000 IOPS | Retain |
| Backup Storage | ebs-gp3-app | 20Gi | 3,000 IOPS | Delete |

## 🔄 Scaling

### Horizontal Scaling
```bash
# Scale application pods
kubectl scale deployment brain-gym-deployment --replicas=3 -n brain-gym
```

### Vertical Scaling
Edit resource limits in `app-deployment.yaml`:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

### Storage Scaling
```bash
# Expand PostgreSQL storage (if needed)
kubectl patch pvc postgres-storage-postgres-statefulset-0 -n brain-gym -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
```

## 🚨 Troubleshooting

### Common Issues

**Pod Not Starting**:
```bash
kubectl describe pod <pod-name> -n brain-gym
kubectl logs <pod-name> -n brain-gym
```

**Database Connection Issues**:
```bash
# Check PostgreSQL status
kubectl exec -it postgres-statefulset-0 -n brain-gym -- pg_isready -U postgres

# Check database logs
kubectl logs postgres-statefulset-0 -n brain-gym
```

**Istio Configuration Issues**:
```bash
# Check VirtualService status
kubectl describe virtualservice brain-gym-vs -n brain-gym

# Check gateway connectivity
kubectl get gateway -n istio-system
```

### Health Checks
```bash
# Application health
curl https://brain-gym.example.com/api/health

# Database health
kubectl exec -it postgres-statefulset-0 -n brain-gym -- pg_isready -U postgres
```

## 🔐 Security

- **mTLS**: Enabled via Istio PeerAuthentication
- **Database**: Encrypted at rest (EBS encryption)
- **Secrets**: Kubernetes secrets for sensitive data
- **RBAC**: Minimal permissions via ServiceAccount
- **Network**: Istio service mesh security

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Documentation](https://istio.io/docs/)
- [PostgreSQL on Kubernetes](https://postgres-operator.readthedocs.io/)
- [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

---

**Support**: For issues and questions, please create an issue in the repository or contact the development team.
