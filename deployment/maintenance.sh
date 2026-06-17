#!/bin/bash

# Soliva Maintenance Mode Toggle
# Usage: ./maintenance.sh [on|off]

TRIGGER_FILE="/var/www/soliva/maintenance.on"
NGINX_CONF="/etc/nginx/sites-available/soliva" # Adjust path as needed

# Ensure trigger directory exists
mkdir -p $(dirname $TRIGGER_FILE)

case "$1" in
    on)
        echo "Enabling Maintenance Mode..."
        touch "$TRIGGER_FILE"
        sudo systemctl reload nginx
        echo "Maintenance Mode is now ON."
        ;;
    off)
        echo "Disabling Maintenance Mode..."
        rm -f "$TRIGGER_FILE"
        sudo systemctl reload nginx
        echo "Maintenance Mode is now OFF."
        ;;
    *)
        echo "Usage: $0 {on|off}"
        exit 1
        ;;
esac
