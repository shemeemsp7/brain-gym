#!/bin/bash

# Brain Gym Kubernetes Dep# Run schema initialization
echo "🗄️ Initializing database schema..."
kubectl apply -f postgres-init-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/postgres-init-schema -n brain-gym

# Deploy application
echo "🎯 Deploying Brain Gym application..."ipt
set -e

echo "🚀 Deploying Brain Gym application to Kubernetes..."

# Apply namespace first
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply Storage Class for AWS EBS GP3
echo "💾 Creating EBS GP3 Storage Classes..."
kubectl apply -f storage-class.yaml
kubectl apply -f storage-classes-additional.yaml

# Apply backup storage
echo "💾 Creating backup storage..."
kubectl apply -f postgres-backup-pvc.yaml

# Apply ConfigMaps and Secrets
echo "🔧 Applying ConfigMaps and Secrets..."
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
# Registry credentials are never committed to the repo — create the pull secret
# out-of-band if it doesn't exist yet:
if ! kubectl get secret dockerhub-registry-secret -n brain-gym >/dev/null 2>&1; then
  echo "❌ Missing pull secret. Create it first:"
  echo "   kubectl create secret docker-registry dockerhub-registry-secret \\"
  echo "     --docker-username=<user> --docker-password=<token> -n brain-gym"
  exit 1
fi

# Apply RBAC
echo "🔐 Applying RBAC..."
kubectl apply -f rbac.yaml

# Apply PostgreSQL resources
echo "🐘 Deploying PostgreSQL StatefulSet..."
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL StatefulSet to be ready..."
kubectl wait --for=condition=ready --timeout=300s pod/postgres-statefulset-0 -n brain-gym

# Run schema initialization
echo "🗄️ Initializing database schema..."
kubectl apply -f postgres-init-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/postgres-init-schema -n brain-gym

# Setup automated backups
echo "🔄 Setting up automated backups..."
kubectl apply -f postgres-backup-cronjob.yaml

# Apply application resources
echo "🎯 Deploying Brain Gym application..."
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml

# Wait for application to be ready
echo "⏳ Waiting for Brain Gym application to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/brain-gym-deployment -n brain-gym

# Apply Istio resources
echo "🌐 Applying Istio resources..."
kubectl apply -f virtualservice.yaml
kubectl apply -f destinationrule.yaml
kubectl apply -f peer-authentication.yaml

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Namespace: brain-gym"
echo "  PostgreSQL: postgres-statefulset (StatefulSet)"
echo "  PostgreSQL Service: postgres-service:5432"
echo "  Application: brain-gym-service:3000"
echo "  Gateway: istio-system/istio-gateway-admin"
echo "  Domain: brain-gym.example.com"
echo ""
echo "🔍 To check the status:"
echo "  kubectl get pods -n brain-gym"
echo "  kubectl get services -n brain-gym"
echo "  kubectl get virtualservices -n brain-gym"
echo ""
echo "🌍 Application will be available at:"
echo "  https://brain-gym.example.com"
