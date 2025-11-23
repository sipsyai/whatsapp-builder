export class PhoneNumberUtil {
  /**
   * Format phone number to E.164 format (without +)
   * Removes all non-digit characters and leading +
   */
  static format(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Remove leading + if present
    return cleaned.replace(/^\+/, '');
  }

  /**
   * Validate phone number format
   * Basic validation: should be 10-15 digits
   */
  static isValid(phone: string): boolean {
    const cleaned = this.format(phone);
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Add country code if not present
   */
  static addCountryCode(phone: string, defaultCountryCode: string = '90'): string {
    const cleaned = this.format(phone);

    // If already has country code, return as is
    if (cleaned.length > 10) {
      return cleaned;
    }

    // Add default country code
    return defaultCountryCode + cleaned;
  }
}
