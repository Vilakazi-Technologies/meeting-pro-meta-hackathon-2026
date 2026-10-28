/** Non-secret Meta IDs for hackathon demo — set in `.env` (EXPO_PUBLIC_*). */

export function getMetaHackathonDefaults(): {
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string;
} {
  return {
    wabaId: process.env.EXPO_PUBLIC_META_WABA_ID?.trim() ?? '',
    phoneNumberId: process.env.EXPO_PUBLIC_META_PHONE_NUMBER_ID?.trim() ?? '',
    displayPhone: process.env.EXPO_PUBLIC_META_DISPLAY_PHONE?.trim() ?? '',
  };
}
