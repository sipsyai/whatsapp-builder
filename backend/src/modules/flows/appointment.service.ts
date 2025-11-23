import { Injectable } from '@nestjs/common';

export interface Appointment {
  id: string;
  service: string;
  stylist: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface TimeSlot {
  id: string;
  title: string;
  enabled: boolean;
}

@Injectable()
export class AppointmentService {
  private appointments: Appointment[] = [];

  // Örnek çalışma saatleri
  private workingHours = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  // Stylist isimleri
  private stylists = {
    stylist_1: 'Ayşe Hanım',
    stylist_2: 'Zeynep Hanım',
    stylist_3: 'Mehmet Bey',
  };

  // Hizmet isimleri ve süreleri
  private services = {
    haircut: { name: 'Saç Kesimi', duration: 30, price: 150 },
    coloring: { name: 'Saç Boyama', duration: 120, price: 500 },
    blowdry: { name: 'Fön', duration: 30, price: 100 },
    perm: { name: 'Perma', duration: 180, price: 800 },
    keratin: { name: 'Keratin Bakımı', duration: 180, price: 1200 },
  };

  /**
   * Get available time slots for a specific date and stylist
   */
  getAvailableSlots(
    date: string,
    stylist: string,
    service: string,
  ): TimeSlot[] {
    // Seçilen tarih ve stylist için mevcut randevuları bul
    const bookedSlots = this.appointments
      .filter(
        (apt) =>
          apt.appointmentDate === date &&
          apt.stylist === stylist &&
          apt.status !== 'cancelled',
      )
      .map((apt) => apt.appointmentTime);

    // Müsait saatleri döndür
    return this.workingHours
      .filter((hour) => !bookedSlots.includes(hour))
      .map((hour) => ({
        id: hour,
        title: hour,
        enabled: true,
      }));
  }

  /**
   * Create a new appointment
   */
  createAppointment(data: {
    service: string;
    stylist: string;
    appointmentDate: string;
    appointmentTime: string;
    customerName: string;
    customerPhone: string;
    notes?: string;
  }): Appointment {
    // Slot'un hala müsait olup olmadığını kontrol et
    const availableSlots = this.getAvailableSlots(
      data.appointmentDate,
      data.stylist,
      data.service,
    );

    const isSlotAvailable = availableSlots.some(
      (slot) => slot.id === data.appointmentTime,
    );

    if (!isSlotAvailable) {
      throw new Error(
        'Bu saat artık müsait değil. Lütfen başka bir saat seçin.',
      );
    }

    const appointment: Appointment = {
      id: this.generateId(),
      service: data.service,
      stylist: data.stylist,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
      createdAt: new Date(),
      status: 'confirmed',
    };

    this.appointments.push(appointment);
    return appointment;
  }

  /**
   * Get appointment details formatted for display
   */
  getAppointmentDetails(appointment: Appointment): string {
    const service = this.services[appointment.service];
    const stylist = this.stylists[appointment.stylist];

    return `
📅 Tarih: ${this.formatDate(appointment.appointmentDate)}
⏰ Saat: ${appointment.appointmentTime}
💇 Hizmet: ${service.name} (${service.price} TL)
👤 Kuaför: ${stylist}
📝 Randevu No: ${appointment.id}
    `.trim();
  }

  /**
   * Get all appointments (for admin)
   */
  getAllAppointments(): Appointment[] {
    return this.appointments;
  }

  /**
   * Get appointments by phone number
   */
  getAppointmentsByPhone(phone: string): Appointment[] {
    return this.appointments.filter((apt) => apt.customerPhone === phone);
  }

  /**
   * Cancel appointment
   */
  cancelAppointment(id: string): boolean {
    const appointment = this.appointments.find((apt) => apt.id === id);
    if (appointment) {
      appointment.status = 'cancelled';
      return true;
    }
    return false;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('tr-TR', options);
  }
}
