# Soliva E-commerce Project

## Overview
Soliva is a production-ready enterprise-grade e-commerce application. 

## Structure
- `Frontend/`: The client application (React + Vite).
- `Backend/`: The server application (Node.js + Express + MongoDB).
- `deployment/`: Configuration files for systemd, Nginx, and bash deployment scripts.

## Setup
Please check the `.env.example` in both `Frontend` and `Backend` to configure your environment variables. 
Set `NODE_ENV=production` when deploying.

## Running
Use Docker Compose to run the backend:
```bash
cd Backend
docker-compose up -d --build
```
