import { prisma } from '../config/database.js';

export interface BusinessHoursConfig {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
  timezone?: string;
}

export class BusinessHoursService {
  /**
   * Parse business hours from JSON field
   * @param businessHours - JSON field from Prisma
   * @returns Parsed BusinessHoursConfig or null
   */
  private parseBusinessHours(businessHours: any): BusinessHoursConfig | null {
    if (typeof businessHours === 'string') {
      try {
        return JSON.parse(businessHours) as BusinessHoursConfig;
      } catch {
        return null;
      }
    }
    if (typeof businessHours === 'object' && businessHours !== null) {
      return businessHours as BusinessHoursConfig;
    }
    return null;
  }

  /**
   * Check if current time is within business hours for a vendor
   * @param vendorId - Vendor ID
   * @returns true if within business hours or business hours not enabled
   */
  async isWithinBusinessHours(vendorId: string): Promise<boolean> {
    const settings = await prisma.chatbotSettings.findUnique({
      where: { vendorId },
    });

    // If business hours not enabled, always return true
    if (!settings || !settings.businessHoursEnabled) {
      return true;
    }

    // If no business hours configured, return true
    if (!settings.businessHours) {
      return true;
    }

    const businessHours = this.parseBusinessHours(settings.businessHours);
    if (!businessHours) {
      return true;
    }

    const now = this.getCurrentTimeInTimezone(businessHours.timezone || 'Africa/Lagos');
    const dayName = this.getDayName(now);
    const dayHours = businessHours[dayName.toLowerCase() as keyof BusinessHoursConfig];

    // If no hours set for this day, consider it closed
    if (!dayHours || typeof dayHours !== 'object' || !('open' in dayHours) || !('close' in dayHours)) {
      return false;
    }

    const currentTime = this.timeToMinutes(`${now.getHours()}:${now.getMinutes()}`);
    const openTime = this.timeToMinutes(dayHours.open);
    const closeTime = this.timeToMinutes(dayHours.close);

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * Get business hours configuration for a vendor
   * @param vendorId - Vendor ID
   * @returns Business hours config or null
   */
  async getBusinessHours(vendorId: string): Promise<BusinessHoursConfig | null> {
    const settings = await prisma.chatbotSettings.findUnique({
      where: { vendorId },
    });

    if (!settings || !settings.businessHoursEnabled || !settings.businessHours) {
      return null;
    }

    return this.parseBusinessHours(settings.businessHours);
  }

  /**
   * Update business hours configuration for a vendor
   * @param vendorId - Vendor ID
   * @param businessHours - Business hours configuration
   * @returns Updated settings
   */
  async updateBusinessHours(vendorId: string, businessHours: BusinessHoursConfig) {
    return prisma.chatbotSettings.upsert({
      where: { vendorId },
      update: {
        businessHoursEnabled: true,
        businessHours: businessHours as any,
      },
      create: {
        vendorId,
        chatbotEnabled: true,
        businessHoursEnabled: true,
        businessHours: businessHours as any,
      },
    });
  }

  /**
   * Enable/disable business hours for a vendor
   * @param vendorId - Vendor ID
   * @param enabled - Whether to enable business hours
   * @returns Updated settings
   */
  async setBusinessHoursEnabled(vendorId: string, enabled: boolean) {
    return prisma.chatbotSettings.upsert({
      where: { vendorId },
      update: { businessHoursEnabled: enabled },
      create: {
        vendorId,
        chatbotEnabled: true,
        businessHoursEnabled: enabled,
      },
    });
  }

  /**
   * Get current time in specified timezone
   * @param timezone - Timezone string (default: Africa/Lagos)
   * @returns Date object in the specified timezone
   */
  private getCurrentTimeInTimezone(timezone: string = 'Africa/Lagos'): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  }

  /**
   * Get day name from date
   * @param date - Date object
   * @returns Day name (lowercase)
   */
  private getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  }

  /**
   * Convert time string to minutes since midnight
   * @param time - Time string in format "HH:MM"
   * @returns Minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get next opening time for a vendor
   * @param vendorId - Vendor ID
   * @returns Next opening time as string or null
   */
  async getNextOpeningTime(vendorId: string): Promise<string | null> {
    const businessHours = await this.getBusinessHours(vendorId);
    if (!businessHours) {
      return null;
    }

    const now = this.getCurrentTimeInTimezone(businessHours.timezone || 'Africa/Lagos');
    const currentDay = this.getDayName(now);
    const currentTime = this.timeToMinutes(`${now.getHours()}:${now.getMinutes()}`);

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = days.indexOf(currentDay);

    // Check remaining time today
    const todayHours = businessHours[currentDay as keyof BusinessHoursConfig];
    if (todayHours && typeof todayHours === 'object' && 'open' in todayHours && 'close' in todayHours) {
      const openTime = this.timeToMinutes(todayHours.open);
      if (currentTime < openTime) {
        return `today at ${todayHours.open}`;
      }
    }

    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      const nextDayHours = businessHours[nextDay as keyof BusinessHoursConfig];
      
      if (nextDayHours && typeof nextDayHours === 'object' && 'open' in nextDayHours) {
        return `${nextDay} at ${nextDayHours.open}`;
      }
    }

    return null;
  }
}

export default new BusinessHoursService();
