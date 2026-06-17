#!/bin/bash

# Ensure log directory exists
mkdir -p /root/Aditya/the-final-Soliva/logs

# Stop current background processes if they are running via gemini-cli
# (Note: This script assumes you want to move from manual/background to systemd)

echo "Copying service files to /etc/systemd/system/..."
sudo cp /root/Aditya/the-final-Soliva/deployment/soliva-backend.service /etc/systemd/system/
sudo cp /root/Aditya/the-final-Soliva/deployment/soliva-frontend.service /etc/systemd/system/
sudo cp /root/Aditya/the-final-Soliva/deployment/soliva-docker.service /etc/systemd/system/

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling and starting services..."
sudo systemctl enable soliva-docker
sudo systemctl enable soliva-backend
sudo systemctl enable soliva-frontend

sudo systemctl restart soliva-docker
sudo systemctl restart soliva-backend
sudo systemctl restart soliva-frontend

echo "Checking status..."
systemctl status soliva-backend --no-pager
systemctl status soliva-frontend --no-pager

echo "Deployment complete. Logs can be found in /root/Aditya/the-final-Soliva/logs/"
