#!/bin/bash

# Ngrok webhook URL'ini al ve göster

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ngrok çalışıyor mu kontrol et
if ! lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ Ngrok çalışmıyor!${NC}"
    echo -e "${YELLOW}Başlatmak için: npm run start-webhook${NC}"
    exit 1
fi

# Ngrok URL'ini al
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Ngrok URL'i alınamadı!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 Webhook URL'iniz${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""
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
echo -e "${GREEN}📊 Ngrok Dashboard:${NC} http://localhost:4040"
echo ""

# URL'i panoya kopyala (varsa)
if command -v xclip &> /dev/null; then
    echo "${NGROK_URL}/api/webhooks/whatsapp" | xclip -selection clipboard
    echo -e "${GREEN}✅ URL panoya kopyalandı!${NC}"
    echo ""
elif command -v pbcopy &> /dev/null; then
    echo "${NGROK_URL}/api/webhooks/whatsapp" | pbcopy
    echo -e "${GREEN}✅ URL panoya kopyalandı!${NC}"
    echo ""
fi
