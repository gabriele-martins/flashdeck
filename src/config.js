// Configuração pública do app. O Client ID do Google é público por natureza
// no fluxo OAuth client-side; a segurança vem das origens autorizadas no
// Google Cloud Console.
export const GOOGLE_CLIENT_ID = "108033196573-83nocg854bnthb1cnveicoshkd1kio74.apps.googleusercontent.com";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
export const DRIVE_FILE = "flashdeck-data.json";
export const DRIVE_FOLDER = "FlashDeck";
export const SCOPE_VERSION = "2";
export const LOCAL_KEY = "flashdeck-data-v1";
export const DAY = 24 * 60 * 60 * 1000;
export const MATURE_DAYS = 21;
export const isConfigured = () => !GOOGLE_CLIENT_ID.startsWith("COLE_SEU");
