import { NextResponse } from 'next/server';

/**
 * Dynamic manifest.json endpoint that uses branding settings from the backend.
 * This allows PWA icons to use uploaded favicon/logo instead of static files.
 * 
 * Route is at /api/manifest - Next.js API routes take precedence over rewrites.
 */
export async function GET() {
  try {
    // Fetch branding settings from backend
    // In development, API is proxied via next.config.js rewrites
    // In production, use NEXT_PUBLIC_API_URL if set, otherwise relative path
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const apiPath = baseUrl ? `${baseUrl}/api` : '/api';
    
    const brandingResponse = await fetch(`${apiPath}/branding`, {
      cache: 'no-store', // Always fetch fresh branding settings
    });

    let faviconUrl: string | null = null;
    let appName = 'Sourdough';
    let shortName = 'SD';
    let themeColor = '#3b82f6';
    let backgroundColor = '#ffffff';

    if (brandingResponse.ok) {
      const branding = await brandingResponse.json();
      faviconUrl = branding.settings?.favicon_url || null;
      themeColor = branding.settings?.primary_color || themeColor;
      backgroundColor = '#ffffff'; // Keep white background for PWA
    }

    // Fetch system settings for app name
    const systemSettingsResponse = await fetch(`${apiPath}/system-settings/public`, {
      cache: 'no-store',
    });

    if (systemSettingsResponse.ok) {
      const systemSettings = await systemSettingsResponse.json();
      appName = systemSettings.settings?.general?.app_name || appName;
      // Generate short name from app name (first 2-3 characters)
      shortName = appName.length > 3 ? appName.substring(0, 3).toUpperCase() : appName.toUpperCase();
    }

    // Build icons array - use uploaded favicon if available, otherwise fallback to static icons
    const icons = [];
    
    if (faviconUrl) {
      // Use uploaded favicon for all icon sizes
      // Note: Browsers will scale the image as needed
      icons.push(
        {
          src: faviconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: faviconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        }
      );
    } else {
      // Fallback to static icons if no favicon uploaded
      icons.push(
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        }
      );
    }

    const manifest = {
      name: appName,
      short_name: shortName,
      description: 'Starter Application Framework for AI Development',
      icons,
      theme_color: themeColor,
      background_color: backgroundColor,
      display: 'standalone',
      start_url: '/',
      orientation: 'portrait-primary',
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    // Fallback to static manifest if backend is unavailable
    const fallbackManifest = {
      name: 'Sourdough',
      short_name: 'SD',
      description: 'Starter Application Framework for AI Development',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      orientation: 'portrait-primary',
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
