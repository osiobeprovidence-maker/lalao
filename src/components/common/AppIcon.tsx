import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Zap } from 'lucide-react';

interface AppIconProps {
  className?: string;
  fallbackClassName?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  className = "w-5 h-5", 
  fallbackClassName = "text-white fill-white" 
}) => {
  const settings = useQuery(api.platformSettings.getBrandingSettings);

  // If loading or if there's no appIconUrl, show the fallback icon
  if (settings === undefined || !settings?.appIconUrl) {
    return <Zap className={`${className} ${fallbackClassName}`} />;
  }

  // Render the custom configured icon
  return (
    <img 
      src={settings.appIconUrl} 
      alt="Lalao App Icon" 
      className={`object-contain ${className}`}
    />
  );
};
