import { Injectable } from '@nestjs/common';

interface CalendarEvent {
  stylist: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

@Injectable()
export class MockCalendarService {
  // Mock calendar data - Her kuaför için dolu randevular
  private mockEvents: CalendarEvent[] = [
    // Ali Bey'in randevuları
    {
      stylist: 'ali',
      date: '2025-01-24',
      startTime: '09:00',
      endTime: '10:00',
      title: 'Ahmet - Saç Kesimi',
    },
    {
      stylist: 'ali',
      date: '2025-01-24',
      startTime: '11:00',
      endTime: '12:00',
      title: 'Mehmet - Saç Kesimi',
    },
    {
      stylist: 'ali',
      date: '2025-01-24',
      startTime: '14:00',
      endTime: '16:00',
      title: 'Can - Saç Boyama',
    },
    {
      stylist: 'ali',
      date: '2025-01-25',
      startTime: '10:00',
      endTime: '11:00',
      title: 'Yusuf - Saç Kesimi',
    },

    // Ayşe Hanım'ın randevuları
    {
      stylist: 'ayse',
      date: '2025-01-24',
      startTime: '10:00',
      endTime: '11:00',
      title: 'Zehra - Saç Kesimi',
    },
    {
      stylist: 'ayse',
      date: '2025-01-24',
      startTime: '13:00',
      endTime: '14:00',
      title: 'Fatma - Fön',
    },
    {
      stylist: 'ayse',
      date: '2025-01-25',
      startTime: '09:00',
      endTime: '11:00',
      title: 'Elif - Saç Boyama',
    },

    // Zeynep Hanım'ın randevuları
    {
      stylist: 'zeynep',
      date: '2025-01-24',
      startTime: '09:00',
      endTime: '10:00',
      title: 'Selin - Saç Kesimi',
    },
    {
      stylist: 'zeynep',
      date: '2025-01-24',
      startTime: '15:00',
      endTime: '16:00',
      title: 'Ayşe - Fön',
    },
  ];

  // Çalışma saatleri
  private workingHours = {
    start: '09:00',
    end: '18:00',
    slotDuration: 60, // dakika
  };

  /**
   * Belirli bir kuaför için müsait tarihleri döndür
   */
  getAvailableDates(stylist: string): Array<{ id: string; title: string; enabled: boolean }> {
    const dates: Array<{ id: string; title: string; enabled: boolean }> = [];
    const today = new Date();

    // Önümüzdeki 14 gün için tarihler oluştur
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split('T')[0];
      const dateFormatted = date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'short',
      });

      dates.push({
        id: dateStr,
        title: dateFormatted,
        enabled: true,
      });
    }

    return dates;
  }

  /**
   * Belirli bir kuaför ve tarih için müsait saatleri döndür
   */
  getAvailableSlots(
    stylist: string,
    date: string,
  ): Array<{ id: string; title: string; enabled: boolean }> {
    // O tarih için dolu saatleri bul
    const bookedSlots = this.mockEvents
      .filter((event) => event.stylist === stylist && event.date === date)
      .map((event) => event.startTime);

    console.log(
      `[MockCalendar] ${stylist} için ${date} tarihinde dolu saatler:`,
      bookedSlots,
    );

    // Tüm çalışma saatlerini oluştur
    const allSlots = this.generateTimeSlots();

    // Dolu olmayan saatleri döndür
    const availableSlots = allSlots
      .filter((slot) => !bookedSlots.includes(slot))
      .map((slot) => ({
        id: slot,
        title: slot,
        enabled: true,
      }));

    console.log(
      `[MockCalendar] ${stylist} için ${date} tarihinde müsait saatler:`,
      availableSlots.map((s) => s.id),
    );

    return availableSlots;
  }

  /**
   * Çalışma saatleri içinde tüm time slot'ları oluştur
   */
  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = this.workingHours.start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = this.workingHours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      slots.push(timeStr);

      // Slot duration kadar ilerle
      currentMinute += this.workingHours.slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  }

  /**
   * Kuaför bilgilerini döndür
   */
  getStylistInfo(stylist: string): { name: string; specialties: string[] } {
    const stylists = {
      ali: {
        name: 'Ali Bey',
        specialties: ['Saç Kesimi', 'Sakal Traşı'],
      },
      ayse: {
        name: 'Ayşe Hanım',
        specialties: ['Saç Boyama', 'Keratin'],
      },
      zeynep: {
        name: 'Zeynep Hanım',
        specialties: ['Perma', 'Fön'],
      },
    };

    return stylists[stylist] || { name: 'Unknown', specialties: [] };
  }

  /**
   * Google Calendar entegrasyonu için hazırlık
   * TODO: Google Calendar API ile değiştir
   */
  async getGoogleCalendarEvents(
    stylist: string,
    date: string,
  ): Promise<CalendarEvent[]> {
    // Buraya Google Calendar API entegrasyonu eklenecek
    // Şimdilik mock data döndürüyoruz
    return this.mockEvents.filter(
      (event) => event.stylist === stylist && event.date === date,
    );
  }
}
