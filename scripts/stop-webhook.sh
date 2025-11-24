#!/bin/bash

# WhatsApp Webhook Development Stopper
# Backend ve ngrok'u durdurur

echo "🛑 Webhook servisleri durduruluyor..."

# Log dizini
LOG_DIR="$(dirname "$0")/../logs"

# PID dosyalarını oku ve process'leri durdur
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔧 Backend durduruluyor (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    rm -f "$LOG_DIR/backend.pid"
fi

if [ -f "$LOG_DIR/ngrok.pid" ]; then
    NGROK_PID=$(cat "$LOG_DIR/ngrok.pid")
    if ps -p $NGROK_PID > /dev/null 2>&1; then
        echo "🌐 Ngrok durduruluyor (PID: $NGROK_PID)..."
        kill $NGROK_PID 2>/dev/null || true
    fi
    rm -f "$LOG_DIR/ngrok.pid"
fi

# Port 3000 ve 4040'ı temizle
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🧹 Port 3000 temizleniyor..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🧹 Port 4040 temizleniyor..."
    lsof -ti:4040 | xargs kill -9 2>/dev/null || true
fi

# Ngrok process'lerini temizle
pkill -f ngrok 2>/dev/null || true

echo "✅ Tüm servisler durduruldu"
