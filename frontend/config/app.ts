/**
 * Centralized app configuration for branding and display settings.
 * 
 * Logo/icon paths are null by default - the Logo component displays
 * text fallbacks. When logos are uploaded via the branding configuration
 * page, these paths will be populated.
 */
export const APP_CONFIG = {
  /** Full application name */
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Sourdough',
  
  /** Short name for collapsed states (1-3 characters recommended) */
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'SD',
  
  /** Full logo path (null = use text fallback) */
  logo: null as string | null,
  
  /** Square icon path for collapsed sidebar (null = use text fallback) */
  icon: null as string | null,
  
  /** Favicon path */
  favicon: '/favicon.ico',
};

export type AppConfig = typeof APP_CONFIG;
