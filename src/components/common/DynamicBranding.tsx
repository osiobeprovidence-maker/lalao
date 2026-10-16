import React, { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const DynamicBranding: React.FC = () => {
  const settings = useQuery(api.platformSettings.getBrandingSettings);

  useEffect(() => {
    if (!settings) return;

    // 1. Update Browser Title
    if (settings.browserTitle) {
      document.title = settings.browserTitle;
    }

    // 2. Update Favicons
    if (settings.faviconUrl || settings.appIconUrl) {
      const iconUrl = settings.faviconUrl || settings.appIconUrl;
      if (iconUrl) {
        const iconLinks = document.querySelectorAll("link[rel~='icon']");
        iconLinks.forEach((el) => {
          (el as HTMLLinkElement).href = iconUrl;
        });

        const appleLinks = document.querySelectorAll("link[rel~='apple-touch-icon']");
        if (appleLinks.length > 0) {
          appleLinks.forEach((el) => {
            (el as HTMLLinkElement).href = iconUrl;
          });
        } else {
          const linkApple = document.createElement('link');
          linkApple.rel = 'apple-touch-icon';
          linkApple.href = iconUrl;
          document.head.appendChild(linkApple);
        }
      }
    }

    // 3. Update Theme Color
    if (settings.primaryColor) {
      let metaTheme = document.querySelector("meta[name='theme-color']");
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', settings.primaryColor);
    }

    // 4. Update PWA Manifest (only when custom branding is set)
    if (settings.appIconUrl || settings.platformName || settings.pwaName) {
      const pwaName = settings.pwaName || settings.platformName || "Lalao";
      const pwaShortName = settings.pwaShortName || settings.shortName || "Lalao";
      const pwaIcon = settings.appIconUrl || "/icon-512.png";
      const themeColor = settings.primaryColor || "#5E43F3";
      const backgroundColor = settings.backgroundColor || "#0B0F19";

      const manifestData = {
        id: "/app",
        name: pwaName,
        short_name: pwaShortName,
        start_url: "/app",
        scope: "/",
        display: "standalone",
        background_color: backgroundColor,
        theme_color: themeColor,
        icons: [
          {
            src: pwaIcon,
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };

      const manifestDataUri = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifestData))}`;
      let linkManifest = document.querySelector("link[rel~='manifest']") as HTMLLinkElement;
      if (!linkManifest) {
        linkManifest = document.createElement('link');
        linkManifest.rel = 'manifest';
        document.head.appendChild(linkManifest);
      }
      linkManifest.href = manifestDataUri;
    }
  }, [settings]);

  return null; // This component does not render anything
};
