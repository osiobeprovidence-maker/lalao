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
        let linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!linkIcon) {
          linkIcon = document.createElement('link');
          linkIcon.rel = 'icon';
          document.head.appendChild(linkIcon);
        }
        linkIcon.href = iconUrl;

        let linkApple = document.querySelector("link[rel~='apple-touch-icon']") as HTMLLinkElement;
        if (!linkApple) {
          linkApple = document.createElement('link');
          linkApple.rel = 'apple-touch-icon';
          document.head.appendChild(linkApple);
        }
        linkApple.href = iconUrl;
      }
    }

    // 3. Update PWA Manifest
    const pwaName = settings.pwaName || settings.platformName || "Lalao App";
    const pwaShortName = settings.pwaShortName || settings.shortName || "Lalao";
    const pwaIcon = settings.appIconUrl || "/mascot.png";
    const themeColor = settings.primaryColor || "#5E43F3";
    const backgroundColor = settings.backgroundColor || "#ffffff";

    const manifestData = {
      name: pwaName,
      short_name: pwaShortName,
      start_url: "/",
      display: "standalone",
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: [
        {
          src: pwaIcon,
          sizes: "192x192 512x512",
          type: "image/png", // Assuming PNG, or image/webp from cloudinary
          purpose: "any maskable"
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], {
      type: "application/json"
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let linkManifest = document.querySelector("link[rel~='manifest']") as HTMLLinkElement;
    if (!linkManifest) {
      linkManifest = document.createElement('link');
      linkManifest.rel = 'manifest';
      document.head.appendChild(linkManifest);
    }
    linkManifest.href = manifestUrl;

    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, [settings]);

  return null; // This component does not render anything
};
