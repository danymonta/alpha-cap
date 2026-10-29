#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	curl -fsSL https://get.docker.com | sudo sh
	sudo usermod -aG docker "$USER"
fi

for port in 80 443; do
	if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
		sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "$port" -j ACCEPT
	fi
done
if command -v netfilter-persistent >/dev/null 2>&1; then
	sudo netfilter-persistent save
fi

if [[ ! -f .env ]]; then
	public_ip="${PUBLIC_IP:-$(curl -fsS https://api.ipify.org)}"
	host_suffix="$(echo "$public_ip" | tr . -).sslip.io"
	{
		echo "WEB_HOST=${WEB_HOST:-loom-$host_suffix}"
		echo "S3_HOST=${S3_HOST:-s3-$host_suffix}"
		echo "MYSQL_PASSWORD=$(openssl rand -hex 24)"
		echo "MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)"
		echo "MINIO_PASSWORD=$(openssl rand -hex 24)"
		echo "DATABASE_ENCRYPTION_KEY=$(openssl rand -hex 32)"
		echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)"
		echo "MEDIA_SERVER_WEBHOOK_SECRET=$(openssl rand -hex 32)"
		echo "RESEND_API_KEY="
		echo "RESEND_FROM_DOMAIN="
	} > .env
	chmod 600 .env
fi

mkdir -p downloads
sudo docker compose up -d --build
grep -E '^(WEB_HOST|S3_HOST)=' .env
