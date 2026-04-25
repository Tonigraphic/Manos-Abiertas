# Guía de Deployment - LSC Recognition

## Deployment Frontend (Vercel)

### Opción 1: Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd nextjs-setup
vercel

# Production
vercel --prod
```

### Opción 2: Vercel Dashboard

1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
   NEXT_PUBLIC_WS_URL=wss://api.tu-dominio.com/ws
   ```
3. Deploy automático en cada push

### Variables de Entorno en Vercel

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_WS_URL production
```

---

## Deployment Backend (Railway/Render/AWS)

### Opción 1: Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Opción 2: Render

**render.yaml**
```yaml
services:
  - type: web
    name: lsc-recognition-api
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
      - key: DATABASE_URL
        fromDatabase:
          name: lsc-db
          property: connectionString
```

### Opción 3: Docker + AWS ECS

**Dockerfile (Backend)**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgthread-2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/lsc_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - ./videos:/app/videos
    depends_on:
      - db
      - redis

  frontend:
    build: ./nextjs-setup
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=lsc_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Deployment Completo (Production-Ready)

### Arquitectura Recomendada

```
[Cliente] → [CDN/Vercel] → [Frontend Next.js]
                              ↓
                          [API Gateway]
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
         [FastAPI Backend]              [WebSocket Server]
              ↓                               ↓
         [PostgreSQL]                    [Redis Cache]
              ↓
         [S3/Storage]
         (Videos)
```

### 1. Frontend en Vercel

```bash
# Configuración automática
vercel --prod
```

### 2. Backend en AWS ECS

```bash
# Build y push Docker image
docker build -t lsc-backend:latest ./backend
docker tag lsc-backend:latest YOUR_ECR_REPO:latest
docker push YOUR_ECR_REPO:latest

# Crear tarea ECS
aws ecs create-task-definition --cli-input-json file://task-definition.json

# Actualizar servicio
aws ecs update-service --cluster lsc-cluster --service lsc-backend --task-definition lsc-backend
```

### 3. Base de Datos (AWS RDS PostgreSQL)

```bash
# Crear instancia RDS
aws rds create-db-instance \
  --db-instance-identifier lsc-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

### 4. Almacenamiento Videos (S3)

```bash
# Crear bucket
aws s3 mb s3://lsc-videos

# Configurar CORS
aws s3api put-bucket-cors --bucket lsc-videos --cors-configuration file://cors.json
```

**cors.json**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://tu-dominio.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 5. CDN (CloudFront)

```bash
# Crear distribución CloudFront para videos
aws cloudfront create-distribution --origin-domain-name lsc-videos.s3.amazonaws.com
```

---

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
        working-directory: ./nextjs-setup
      - run: npm run build
        working-directory: ./nextjs-setup
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push Docker image
        run: |
          docker build -t lsc-backend:latest ./backend
          docker tag lsc-backend:latest ${{ secrets.ECR_REPO }}:latest
          docker push ${{ secrets.ECR_REPO }}:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster lsc-cluster --service lsc-backend --force-new-deployment
```

---

## Monitoreo y Logs

### Sentry (Error Tracking)

```bash
# Frontend
npm install @sentry/nextjs

# next.config.mjs
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(nextConfig, {
  org: "tu-org",
  project: "lsc-frontend",
});
```

### CloudWatch Logs (Backend)

```python
# backend/main.py
import logging
from watchtower import CloudWatchLogHandler

logger = logging.getLogger(__name__)
logger.addHandler(CloudWatchLogHandler(log_group='lsc-backend'))
```

---

## Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Base de datos con backups automáticos
- [ ] SSL/TLS habilitado (HTTPS)
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Logs y monitoreo activos
- [ ] Tests pasando (CI)
- [ ] Documentación actualizada
- [ ] Secretos en vault/secrets manager
- [ ] Health checks configurados
- [ ] Auto-scaling configurado
- [ ] CDN para assets estáticos
- [ ] Backups de videos en S3

---

## Costos Estimados (AWS)

| Servicio | Costo Mensual |
|----------|---------------|
| Vercel (Frontend) | $0 - $20 |
| ECS Fargate (Backend) | ~$15 |
| RDS t3.micro | ~$15 |
| S3 (100GB videos) | ~$3 |
| CloudFront | ~$5 |
| **Total** | **~$40-60/mes** |

---

## Soporte y Mantenimiento

- Actualizar dependencias mensualmente
- Revisar logs semanalmente
- Backup de BD diario
- Pruebas de carga trimestrales
- Actualización de modelo ML según necesidad
