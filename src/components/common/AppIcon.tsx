import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AppIconProps {
  className?: string;
  fallbackClassName?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  className = "w-8 h-8", 
  fallbackClassName = "" 
}) => {
  const settings = useQuery(api.platformSettings.getBrandingSettings);
  const iconSrc = settings?.appIconUrl || '/mascot.png';

  return (
    <img 
      src={iconSrc} 
      alt="Lalao Mascot" 
      className={`rounded-full overflow-hidden object-cover shrink-0 ${className}`}
    />
  );
};
