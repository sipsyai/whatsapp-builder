#!/bin/bash

# WhatsApp Webhook Development Starter
# Bu script backend ve ngrok'u aynı anda başlatır

set -e

echo "🚀 WhatsApp Webhook Development Başlatılıyor..."
echo ""

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend dizinine git
cd "$(dirname "$0")/../backend"

# .env dosyası kontrolü
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env dosyası bulunamadı!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env dosyası bulundu${NC}"

# Node modules kontrolü
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules bulunamadı, dependencies yükleniyor...${NC}"
    npm install
fi

# PostgreSQL kontrolü
echo -e "${BLUE}🔍 PostgreSQL bağlantısı kontrol ediliyor...${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL çalışıyor${NC}"
else
    echo -e "${RED}❌ PostgreSQL çalışmıyor! Lütfen PostgreSQL'i başlatın.${NC}"
    exit 1
fi

# Port 3000 kontrolü
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3000 zaten kullanımda!${NC}"
    echo -e "${YELLOW}   Mevcut process'i durduruyor...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Port 4040 kontrolü (ngrok web interface)
if lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Ngrok zaten çalışıyor olabilir, durduruluyor...${NC}"
    pkill -f ngrok 2>/dev/null || true
    sleep 2
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Backend ve Ngrok başlatılıyor...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Log dosyası oluştur
LOG_DIR="$(dirname "$0")/../logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend-$(date +%Y%m%d-%H%M%S).log"
NGROK_LOG="$LOG_DIR/ngrok-$(date +%Y%m%d-%H%M%S).log"

# Backend'i arka planda başlat
echo -e "${BLUE}🔧 Backend başlatılıyor...${NC}"
npm run start:dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Backend'in başlamasını bekle
echo -e "${YELLOW}⏳ Backend'in başlaması bekleniyor (maksimum 30 saniye)...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend başarıyla başlatıldı! (PID: $BACKEND_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend 30 saniye içinde başlamadı!${NC}"
        echo -e "${RED}   Log dosyası: $BACKEND_LOG${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Ngrok'u arka planda başlat
echo -e "${BLUE}🌐 Ngrok başlatılıyor...${NC}"
ngrok http 3000 --log=stdout > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

# Ngrok'un başlamasını bekle
echo -e "${YELLOW}⏳ Ngrok'un başlaması bekleniyor...${NC}"
sleep 3

# Ngrok URL'ini al
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Ngrok URL'i alınamadı!${NC}"
    echo -e "${RED}   Log dosyası: $NGROK_LOG${NC}"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Ngrok başarıyla başlatıldı! (PID: $NGROK_PID)${NC}"
echo ""

# Başarı mesajı
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Tüm servisler başarıyla başlatıldı!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📍 Backend URL:${NC}        http://localhost:3000"
echo -e "${GREEN}🌐 Ngrok Public URL:${NC}  ${NGROK_URL}"
echo -e "${GREEN}📊 Ngrok Dashboard:${NC}   http://localhost:4040"
echo ""
echo -e "${YELLOW}📝 Webhook URL'iniz:${NC}"
echo -e "${GREEN}${NGROK_URL}/api/webhooks/whatsapp${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚙️  Meta Dashboard'da Webhook Yapılandırması${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Meta Developer Console'a gidin:"
echo -e "   ${BLUE}https://developers.facebook.com/apps/841990238230922/whatsapp-business/wa-settings/${NC}"
echo ""
echo "2. Webhook bölümünde 'Edit' butonuna tıklayın"
echo ""
echo "3. Şu değerleri girin:"
echo -e "   ${GREEN}Callback URL:${NC}  ${NGROK_URL}/api/webhooks/whatsapp"
echo -e "   ${GREEN}Verify Token:${NC}  sipsy_webhook_2025"
echo ""
echo "4. 'Verify and Save' butonuna tıklayın"
echo ""
echo "5. Webhook fields için şunları seçin:"
echo "   ✅ messages"
echo "   ✅ message_status"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Log Dosyaları:${NC}"
echo -e "   Backend: ${BACKEND_LOG}"
echo -e "   Ngrok:   ${NGROK_LOG}"
echo ""
echo -e "${RED}🛑 Durdurmak için: Ctrl+C veya 'npm run stop-webhook'${NC}"
echo ""

# PID'leri kaydet
echo $BACKEND_PID > "$LOG_DIR/backend.pid"
echo $NGROK_PID > "$LOG_DIR/ngrok.pid"

# Logları takip et
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📄 Backend Logları (Ctrl+C ile çıkış):${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Servisler durduruluyor...${NC}"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null || true
    rm -f "$LOG_DIR/backend.pid" "$LOG_DIR/ngrok.pid"
    echo -e "${GREEN}✅ Tüm servisler durduruldu${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Logları göster
tail -f "$BACKEND_LOG"
