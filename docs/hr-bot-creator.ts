/**
 * İnsan Kaynakları (HR) Chatbot Oluşturma Script'i
 *
 * Bu script, WhatsApp Builder API'sini kullanarak kapsamlı bir
 * İnsan Kaynakları botu oluşturur.
 *
 * Özellikler:
 * 1. İş Başvurusu Alma
 * 2. İzin/Rapor Talebi
 * 3. Maaş/SGK Sorguları
 * 4. Randevu Sistemi
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/chatbots';

interface CreateChatBotDto {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
}

// Node ID'leri
const NODE_IDS = {
  START: 'start_node',
  MAIN_MENU: 'main_menu',

  // İş Başvurusu Flow
  JOB_APP_NAME: 'job_app_name',
  JOB_APP_POSITION: 'job_app_position',
  JOB_APP_CV: 'job_app_cv',
  JOB_APP_CONFIRM: 'job_app_confirm',

  // İzin/Rapor Flow
  LEAVE_TYPE: 'leave_type',
  LEAVE_START: 'leave_start_date',
  LEAVE_END: 'leave_end_date',
  LEAVE_REASON: 'leave_reason',
  LEAVE_CONFIRM: 'leave_confirm',

  // Maaş/SGK Flow
  SALARY_MENU: 'salary_menu',
  SALARY_INFO: 'salary_info_msg',
  SGK_INFO: 'sgk_info_msg',
  PAYROLL_INFO: 'payroll_info_msg',

  // Randevu Flow
  APPT_DEPT: 'appt_department',
  APPT_DATE: 'appt_date',
  APPT_TIME: 'appt_time',
  APPT_CONFIRM: 'appt_confirm',

  // Return nodes
  RETURN_MENU_1: 'return_menu_1',
  RETURN_MENU_2: 'return_menu_2',
  RETURN_MENU_3: 'return_menu_3',
  RETURN_MENU_4: 'return_menu_4',
};

// Flow tanımı
const hrBotFlow: CreateChatBotDto = {
  name: 'İnsan Kaynakları Asistanı',
  description: 'İş başvurusu, izin talebi, maaş sorguları ve randevu alma işlemlerini yöneten WhatsApp botu',
  nodes: [
    // ============ START NODE ============
    {
      id: NODE_IDS.START,
      type: 'start',
      position: { x: 100, y: 50 },
      data: {
        label: 'Başlangıç',
        type: 'start',
      },
    },

    // ============ MAIN MENU ============
    {
      id: NODE_IDS.MAIN_MENU,
      type: 'question',
      position: { x: 100, y: 200 },
      data: {
        label: 'Ana Menü',
        type: 'question',
        content: '👋 *İnsan Kaynakları Asistanına Hoş Geldiniz!*\n\nSize nasıl yardımcı olabilirim?',
        questionType: 'list',
        listButtonText: 'Seçenekleri Gör',
        listSections: [
          {
            id: 'hr_services',
            title: 'İK Hizmetleri',
            rows: [
              {
                id: 'job_application',
                title: '💼 İş Başvurusu',
                description: 'Yeni pozisyon için başvuru yapın',
              },
              {
                id: 'leave_request',
                title: '🏖️ İzin/Rapor Talebi',
                description: 'İzin veya rapor talebinde bulunun',
              },
              {
                id: 'salary_sgk',
                title: '💰 Maaş/SGK Bilgileri',
                description: 'Maaş ve SGK bilgilerinizi sorgulayın',
              },
              {
                id: 'appointment',
                title: '📅 Randevu Al',
                description: 'İK departmanı ile görüşme ayarlayın',
              },
            ],
          },
        ],
        variable: 'main_menu_choice',
      },
    },

    // ============ JOB APPLICATION FLOW ============
    {
      id: NODE_IDS.JOB_APP_NAME,
      type: 'question',
      position: { x: 100, y: 400 },
      data: {
        label: 'Başvuran İsmi',
        type: 'question',
        content: '💼 *İş Başvurusu Formu*\n\nAdınız ve soyadınız nedir?',
        questionType: 'text',
        variable: 'applicant_name',
      },
    },
    {
      id: NODE_IDS.JOB_APP_POSITION,
      type: 'question',
      position: { x: 100, y: 550 },
      data: {
        label: 'Pozisyon Seçimi',
        type: 'question',
        content: 'Hangi pozisyon için başvuru yapmak istiyorsunuz?',
        questionType: 'list',
        listButtonText: 'Pozisyon Seç',
        listSections: [
          {
            id: 'tech_positions',
            title: 'Teknoloji',
            rows: [
              {
                id: 'software_developer',
                title: 'Yazılım Geliştirici',
                description: 'Full Stack / Backend / Frontend',
              },
              {
                id: 'data_analyst',
                title: 'Veri Analisti',
                description: 'Data Science & Analytics',
              },
            ],
          },
          {
            id: 'business_positions',
            title: 'İş Geliştirme',
            rows: [
              {
                id: 'sales_rep',
                title: 'Satış Temsilcisi',
                description: 'B2B / B2C Satış',
              },
              {
                id: 'marketing_specialist',
                title: 'Pazarlama Uzmanı',
                description: 'Dijital Pazarlama',
              },
            ],
          },
        ],
        variable: 'position',
      },
    },
    {
      id: NODE_IDS.JOB_APP_CV,
      type: 'question',
      position: { x: 100, y: 700 },
      data: {
        label: 'CV Bilgisi',
        type: 'question',
        content: 'Kısaca kendinizden bahseder misiniz?\n\n(Eğitim, deneyim, yetenekler)',
        questionType: 'text',
        variable: 'cv_info',
      },
    },
    {
      id: NODE_IDS.JOB_APP_CONFIRM,
      type: 'message',
      position: { x: 100, y: 850 },
      data: {
        label: 'Başvuru Onayı',
        type: 'message',
        content: '✅ *Başvurunuz Alındı!*\n\n*Ad Soyad:* {{applicant_name}}\n*Pozisyon:* {{position}}\n*Özet:* {{cv_info}}\n\nBaşvurunuz değerlendirmeye alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.\n\n_İK Departmanı tarafından 3-5 iş günü içinde geri dönüş yapılacaktır._',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.RETURN_MENU_1,
      type: 'question',
      position: { x: 100, y: 1000 },
      data: {
        label: 'Ana Menüye Dön',
        type: 'question',
        content: 'Başka bir işlem yapmak ister misiniz?',
        questionType: 'buttons',
        buttons: ['Ana Menü', 'Çıkış'],
        variable: 'return_action_1',
      },
    },

    // ============ LEAVE REQUEST FLOW ============
    {
      id: NODE_IDS.LEAVE_TYPE,
      type: 'question',
      position: { x: 500, y: 400 },
      data: {
        label: 'İzin Tipi',
        type: 'question',
        content: '🏖️ *İzin/Rapor Talebi*\n\nNe tür bir izin/rapor talebiniz var?',
        questionType: 'buttons',
        buttons: ['Yıllık İzin', 'Sağlık Raporu', 'Mazeret İzni'],
        variable: 'leave_type',
      },
    },
    {
      id: NODE_IDS.LEAVE_START,
      type: 'question',
      position: { x: 500, y: 550 },
      data: {
        label: 'Başlangıç Tarihi',
        type: 'question',
        content: 'Başlangıç tarihini giriniz:\n\n_(Örnek: 15.03.2024)_',
        questionType: 'text',
        variable: 'leave_start_date',
      },
    },
    {
      id: NODE_IDS.LEAVE_END,
      type: 'question',
      position: { x: 500, y: 700 },
      data: {
        label: 'Bitiş Tarihi',
        type: 'question',
        content: 'Bitiş tarihini giriniz:\n\n_(Örnek: 20.03.2024)_',
        questionType: 'text',
        variable: 'leave_end_date',
      },
    },
    {
      id: NODE_IDS.LEAVE_REASON,
      type: 'question',
      position: { x: 500, y: 850 },
      data: {
        label: 'İzin Açıklaması',
        type: 'question',
        content: 'Varsa açıklama ekleyiniz:',
        questionType: 'text',
        variable: 'leave_reason',
      },
    },
    {
      id: NODE_IDS.LEAVE_CONFIRM,
      type: 'message',
      position: { x: 500, y: 1000 },
      data: {
        label: 'İzin Onayı',
        type: 'message',
        content: '✅ *İzin Talebiniz Alındı!*\n\n*Tip:* {{leave_type}}\n*Başlangıç:* {{leave_start_date}}\n*Bitiş:* {{leave_end_date}}\n*Açıklama:* {{leave_reason}}\n\nTalebin yöneticiniz tarafından onaylanması bekleniyor.\n\n_Onay/red durumu e-posta ile bildirilecektir._',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.RETURN_MENU_2,
      type: 'question',
      position: { x: 500, y: 1150 },
      data: {
        label: 'Ana Menüye Dön',
        type: 'question',
        content: 'Başka bir işlem yapmak ister misiniz?',
        questionType: 'buttons',
        buttons: ['Ana Menü', 'Çıkış'],
        variable: 'return_action_2',
      },
    },

    // ============ SALARY/SGK FLOW ============
    {
      id: NODE_IDS.SALARY_MENU,
      type: 'question',
      position: { x: 900, y: 400 },
      data: {
        label: 'Maaş/SGK Menüsü',
        type: 'question',
        content: '💰 *Maaş ve SGK Bilgileri*\n\nHangi bilgiyi öğrenmek istiyorsunuz?',
        questionType: 'buttons',
        buttons: ['Maaş Bilgisi', 'SGK Bilgisi', 'Bordro'],
        variable: 'salary_query_type',
      },
    },
    {
      id: NODE_IDS.SALARY_INFO,
      type: 'message',
      position: { x: 800, y: 550 },
      data: {
        label: 'Maaş Bilgisi',
        type: 'message',
        content: '💵 *Maaş Bilgileriniz*\n\n*Brüt Maaş:* 25.000 TL\n*Net Maaş:* 18.750 TL\n\n*Kesintiler:*\n• SGK: 3.750 TL\n• Gelir Vergisi: 2.500 TL\n\n_Detaylı bordronuz her ay e-posta ile gönderilmektedir._',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.SGK_INFO,
      type: 'message',
      position: { x: 900, y: 550 },
      data: {
        label: 'SGK Bilgisi',
        type: 'message',
        content: '🏥 *SGK Bilgileriniz*\n\n*SGK Giriş Tarihi:* 15.01.2020\n*Toplam Prim Gün Sayısı:* 1.485 gün\n*SGK No:* 12345678901\n\n*Sigorta Türü:* 4/a (Hizmet Akdi)\n\n_e-Devlet üzerinden detaylı hizmet dökümünüzü inceleyebilirsiniz._',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.PAYROLL_INFO,
      type: 'message',
      position: { x: 1000, y: 550 },
      data: {
        label: 'Bordro Bilgisi',
        type: 'message',
        content: '📄 *Bordro Bilgileri*\n\n*Son Bordro:* Şubat 2024\n*Ödeme Tarihi:* 28.02.2024\n\n*Kazançlar:*\n• Aylık Ücret: 25.000 TL\n• Yemek Yardımı: 1.500 TL\n• Ulaşım: 500 TL\n\nBordronuz e-posta adresinize gönderilmiştir.\n\n_Geçmiş bordrolarınız personel portalından indirilebilir._',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.RETURN_MENU_3,
      type: 'question',
      position: { x: 900, y: 700 },
      data: {
        label: 'Ana Menüye Dön',
        type: 'question',
        content: 'Başka bir işlem yapmak ister misiniz?',
        questionType: 'buttons',
        buttons: ['Ana Menü', 'Çıkış'],
        variable: 'return_action_3',
      },
    },

    // ============ APPOINTMENT FLOW ============
    {
      id: NODE_IDS.APPT_DEPT,
      type: 'question',
      position: { x: 1300, y: 400 },
      data: {
        label: 'Departman Seçimi',
        type: 'question',
        content: '📅 *Randevu Sistemi*\n\nHangi departman ile görüşmek istiyorsunuz?',
        questionType: 'buttons',
        buttons: ['İK Departmanı', 'Yönetim', 'Diğer'],
        variable: 'appointment_dept',
      },
    },
    {
      id: NODE_IDS.APPT_DATE,
      type: 'question',
      position: { x: 1300, y: 550 },
      data: {
        label: 'Randevu Tarihi',
        type: 'question',
        content: 'Hangi tarihte randevu almak istersiniz?\n\n_(Örnek: 25.03.2024)_',
        questionType: 'text',
        variable: 'appointment_date',
      },
    },
    {
      id: NODE_IDS.APPT_TIME,
      type: 'question',
      position: { x: 1300, y: 700 },
      data: {
        label: 'Randevu Saati',
        type: 'question',
        content: 'Tercih ettiğiniz zaman dilimini seçiniz:',
        questionType: 'list',
        listButtonText: 'Saat Seç',
        listSections: [
          {
            id: 'morning',
            title: 'Sabah',
            rows: [
              { id: '09:00', title: '09:00', description: 'Sabah erkeni' },
              { id: '10:00', title: '10:00', description: 'Sabah' },
              { id: '11:00', title: '11:00', description: 'Öğleden önce' },
            ],
          },
          {
            id: 'afternoon',
            title: 'Öğleden Sonra',
            rows: [
              { id: '13:00', title: '13:00', description: 'Öğle sonrası' },
              { id: '14:00', title: '14:00', description: 'İkindi' },
              { id: '15:00', title: '15:00', description: 'Öğleden sonra' },
            ],
          },
        ],
        variable: 'appointment_time',
      },
    },
    {
      id: NODE_IDS.APPT_CONFIRM,
      type: 'message',
      position: { x: 1300, y: 850 },
      data: {
        label: 'Randevu Onayı',
        type: 'message',
        content: '✅ *Randevunuz Oluşturuldu!*\n\n*Departman:* {{appointment_dept}}\n*Tarih:* {{appointment_date}}\n*Saat:* {{appointment_time}}\n\nRandevunuz takvime eklenmiştir.\n\n_Randevu öncesi size hatırlatma mesajı gönderilecektir._\n\n📍 *Adres:* Şirket Binası, 3. Kat, İK Departmanı',
        messageType: 'text',
      },
    },
    {
      id: NODE_IDS.RETURN_MENU_4,
      type: 'question',
      position: { x: 1300, y: 1000 },
      data: {
        label: 'Ana Menüye Dön',
        type: 'question',
        content: 'Başka bir işlem yapmak ister misiniz?',
        questionType: 'buttons',
        buttons: ['Ana Menü', 'Çıkış'],
        variable: 'return_action_4',
      },
    },
  ],

  edges: [
    // START -> MAIN MENU
    { source: NODE_IDS.START, target: NODE_IDS.MAIN_MENU },

    // MAIN MENU -> FLOWS (sourceHandle ile koşullu yönlendirme simüle edilecek)
    { source: NODE_IDS.MAIN_MENU, target: NODE_IDS.JOB_APP_NAME, sourceHandle: 'job_application' },
    { source: NODE_IDS.MAIN_MENU, target: NODE_IDS.LEAVE_TYPE, sourceHandle: 'leave_request' },
    { source: NODE_IDS.MAIN_MENU, target: NODE_IDS.SALARY_MENU, sourceHandle: 'salary_sgk' },
    { source: NODE_IDS.MAIN_MENU, target: NODE_IDS.APPT_DEPT, sourceHandle: 'appointment' },

    // JOB APPLICATION FLOW
    { source: NODE_IDS.JOB_APP_NAME, target: NODE_IDS.JOB_APP_POSITION },
    { source: NODE_IDS.JOB_APP_POSITION, target: NODE_IDS.JOB_APP_CV },
    { source: NODE_IDS.JOB_APP_CV, target: NODE_IDS.JOB_APP_CONFIRM },
    { source: NODE_IDS.JOB_APP_CONFIRM, target: NODE_IDS.RETURN_MENU_1 },
    { source: NODE_IDS.RETURN_MENU_1, target: NODE_IDS.MAIN_MENU, sourceHandle: 'Ana Menü' },

    // LEAVE REQUEST FLOW
    { source: NODE_IDS.LEAVE_TYPE, target: NODE_IDS.LEAVE_START },
    { source: NODE_IDS.LEAVE_START, target: NODE_IDS.LEAVE_END },
    { source: NODE_IDS.LEAVE_END, target: NODE_IDS.LEAVE_REASON },
    { source: NODE_IDS.LEAVE_REASON, target: NODE_IDS.LEAVE_CONFIRM },
    { source: NODE_IDS.LEAVE_CONFIRM, target: NODE_IDS.RETURN_MENU_2 },
    { source: NODE_IDS.RETURN_MENU_2, target: NODE_IDS.MAIN_MENU, sourceHandle: 'Ana Menü' },

    // SALARY/SGK FLOW
    { source: NODE_IDS.SALARY_MENU, target: NODE_IDS.SALARY_INFO, sourceHandle: 'Maaş Bilgisi' },
    { source: NODE_IDS.SALARY_MENU, target: NODE_IDS.SGK_INFO, sourceHandle: 'SGK Bilgisi' },
    { source: NODE_IDS.SALARY_MENU, target: NODE_IDS.PAYROLL_INFO, sourceHandle: 'Bordro' },
    { source: NODE_IDS.SALARY_INFO, target: NODE_IDS.RETURN_MENU_3 },
    { source: NODE_IDS.SGK_INFO, target: NODE_IDS.RETURN_MENU_3 },
    { source: NODE_IDS.PAYROLL_INFO, target: NODE_IDS.RETURN_MENU_3 },
    { source: NODE_IDS.RETURN_MENU_3, target: NODE_IDS.MAIN_MENU, sourceHandle: 'Ana Menü' },

    // APPOINTMENT FLOW
    { source: NODE_IDS.APPT_DEPT, target: NODE_IDS.APPT_DATE },
    { source: NODE_IDS.APPT_DATE, target: NODE_IDS.APPT_TIME },
    { source: NODE_IDS.APPT_TIME, target: NODE_IDS.APPT_CONFIRM },
    { source: NODE_IDS.APPT_CONFIRM, target: NODE_IDS.RETURN_MENU_4 },
    { source: NODE_IDS.RETURN_MENU_4, target: NODE_IDS.MAIN_MENU, sourceHandle: 'Ana Menü' },
  ],
};

/**
 * Ana fonksiyon - HR botunu oluşturur
 */
async function createHRBot() {
  try {
    console.log('🤖 İnsan Kaynakları Botu oluşturuluyor...\n');

    const response = await axios.post(API_URL, hrBotFlow);

    console.log('✅ Bot başarıyla oluşturuldu!');
    console.log('\n📊 Bot Detayları:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   İsim: ${response.data.name}`);
    console.log(`   Node Sayısı: ${response.data.nodes.length}`);
    console.log(`   Edge Sayısı: ${response.data.edges.length}`);
    console.log(`   Durum: ${response.data.isActive ? 'Aktif' : 'Pasif'}`);
    console.log(`\n🌐 Frontend Builder URL:`);
    console.log(`   http://localhost:3000/builder/${response.data.id}`);

    console.log('\n\n📋 Bot Özellikleri:');
    console.log('   ✓ İş Başvurusu Alma');
    console.log('   ✓ İzin/Rapor Talebi');
    console.log('   ✓ Maaş/SGK Sorguları');
    console.log('   ✓ Randevu Sistemi');

    console.log('\n💡 Sonraki Adımlar:');
    console.log('   1. Botu aktifleştirin: PATCH /api/chatbots/' + response.data.id + '/toggle-active');
    console.log('   2. WhatsApp webhook üzerinden test edin');
    console.log('   3. Frontend builder\'da flow\'u görselleştirin');

    return response.data;
  } catch (error: any) {
    console.error('❌ Bot oluşturma hatası:');
    if (error.response) {
      console.error(`   Durum: ${error.response.status}`);
      console.error(`   Mesaj: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

/**
 * Script'i çalıştır
 */
createHRBot()
  .then(() => {
    console.log('\n✨ İşlem tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 İşlem başarısız oldu!');
    process.exit(1);
  });

export { createHRBot, hrBotFlow };
