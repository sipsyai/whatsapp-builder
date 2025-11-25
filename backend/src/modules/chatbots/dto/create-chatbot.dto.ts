import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatBotNodeDto } from './chatbot-node.dto';
import { ChatBotEdgeDto } from './chatbot-edge.dto';

/**
 * Complete example payload for creating a chatbot with all node types (except whatsapp_flow)
 */
const CHATBOT_EXAMPLE = {
  name: 'Customer Support Bot',
  description: 'Handles customer inquiries with interactive buttons, lists and conditional logic',
  nodes: [
    // 1. START NODE - Entry point
    {
      id: 'node_start',
      type: 'start',
      position: { x: 250, y: 0 },
      data: {
        label: 'Start',
        type: 'start',
      },
    },
    // 2. MESSAGE NODE - Welcome message
    {
      id: 'node_welcome',
      type: 'message',
      position: { x: 250, y: 100 },
      data: {
        label: 'Welcome Message',
        type: 'message',
        messageType: 'text',
        content: 'Merhaba! 👋 WhatsApp Builder destek hattına hoş geldiniz. Size nasıl yardımcı olabilirim?',
      },
    },
    // 3. QUESTION NODE (BUTTONS) - Main menu with buttons
    {
      id: 'node_main_menu',
      type: 'question',
      position: { x: 250, y: 220 },
      data: {
        label: 'Main Menu',
        type: 'question',
        questionType: 'buttons',
        content: 'Lütfen aşağıdaki seçeneklerden birini seçin:',
        headerText: 'Destek Menüsü',
        footerText: 'WhatsApp Builder v1.0',
        buttons: [
          { id: 'btn_tech', title: 'Teknik Destek' },
          { id: 'btn_price', title: 'Fiyat Bilgisi' },
          { id: 'btn_other', title: 'Diğer' },
        ],
        variable: 'menu_selection',
      },
    },
    // 4. CONDITION NODE - Check user selection
    {
      id: 'node_check_selection',
      type: 'condition',
      position: { x: 250, y: 380 },
      data: {
        label: 'Check Selection',
        type: 'condition',
        conditionVar: 'menu_selection',
        conditionOp: 'eq',
        conditionVal: 'Teknik Destek',
      },
    },
    // 5. MESSAGE NODE - Technical support response (YES branch)
    {
      id: 'node_tech_support',
      type: 'message',
      position: { x: 100, y: 500 },
      data: {
        label: 'Tech Support',
        type: 'message',
        messageType: 'text',
        content: 'Teknik destek ekibimiz en kısa sürede sizinle iletişime geçecektir. Lütfen sorununuzu kısaca açıklayın.',
      },
    },
    // 6. QUESTION NODE (LIST) - Service categories (NO branch)
    {
      id: 'node_service_list',
      type: 'question',
      position: { x: 400, y: 500 },
      data: {
        label: 'Service List',
        type: 'question',
        questionType: 'list',
        content: 'Hangi hizmetimiz hakkında bilgi almak istersiniz?',
        headerText: 'Hizmetlerimiz',
        footerText: 'Detaylı bilgi için seçim yapın',
        listButtonText: 'Hizmetleri Gör',
        listSections: [
          {
            id: 'section_plans',
            title: 'Paketler',
            rows: [
              { id: 'row_starter', title: 'Starter Paket', description: 'Küçük işletmeler için ideal' },
              { id: 'row_pro', title: 'Pro Paket', description: 'Orta ölçekli işletmeler için' },
              { id: 'row_enterprise', title: 'Enterprise', description: 'Büyük işletmeler için özel çözümler' },
            ],
          },
          {
            id: 'section_addons',
            title: 'Ek Hizmetler',
            rows: [
              { id: 'row_integration', title: 'API Entegrasyonu', description: 'Mevcut sistemlerinizle entegrasyon' },
              { id: 'row_training', title: 'Eğitim', description: 'Ekibiniz için özel eğitim' },
            ],
          },
        ],
        variable: 'service_selection',
      },
    },
    // 7. QUESTION NODE (TEXT) - Collect user input
    {
      id: 'node_collect_issue',
      type: 'question',
      position: { x: 100, y: 620 },
      data: {
        label: 'Collect Issue',
        type: 'question',
        questionType: 'text',
        content: 'Sorununuzu detaylı bir şekilde yazabilir misiniz?',
        variable: 'user_issue',
      },
    },
    // 8. MESSAGE NODE - Thank you message
    {
      id: 'node_thank_you',
      type: 'message',
      position: { x: 250, y: 740 },
      data: {
        label: 'Thank You',
        type: 'message',
        messageType: 'text',
        content: 'Mesajınız için teşekkür ederiz! 🙏 En kısa sürede size dönüş yapacağız.',
      },
    },
  ],
  edges: [
    { source: 'node_start', target: 'node_welcome' },
    { source: 'node_welcome', target: 'node_main_menu' },
    { source: 'node_main_menu', target: 'node_check_selection' },
    { source: 'node_check_selection', target: 'node_tech_support', sourceHandle: 'true' },
    { source: 'node_check_selection', target: 'node_service_list', sourceHandle: 'false' },
    { source: 'node_tech_support', target: 'node_collect_issue' },
    { source: 'node_service_list', target: 'node_thank_you' },
    { source: 'node_collect_issue', target: 'node_thank_you' },
  ],
};

export class CreateChatBotDto {
  @ApiProperty({
    description: 'Name of the chatbot',
    example: CHATBOT_EXAMPLE.name,
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the chatbot',
    example: CHATBOT_EXAMPLE.description,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of chatbot nodes (flow components)',
    type: [ChatBotNodeDto],
    example: CHATBOT_EXAMPLE.nodes,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotNodeDto)
  nodes?: ChatBotNodeDto[];

  @ApiPropertyOptional({
    description: 'Array of edges connecting nodes',
    type: [ChatBotEdgeDto],
    example: CHATBOT_EXAMPLE.edges,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotEdgeDto)
  edges?: ChatBotEdgeDto[];
}
