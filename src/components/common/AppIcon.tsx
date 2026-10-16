import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LalaoMascot } from '../mascot/LalaoMascot';

interface AppIconProps {
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  className = "w-8 h-8", 
  fallbackClassName = "",
  alt = "Lalao App Icon"
}) => {
  const settings = useQuery(api.platformSettings.getBrandingSettings);
  const preferredSrc = settings?.appIconUrl || '/app-icon.png';
  
  const [currentSrc, setCurrentSrc] = useState<string>(preferredSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (settings?.appIconUrl) {
      setCurrentSrc(settings.appIconUrl);
      setHasError(false);
    }
  }, [settings?.appIconUrl]);

  const handleError = () => {
    if (currentSrc !== '/app-icon.png' && currentSrc !== '/icon-192.png') {
      setCurrentSrc('/app-icon.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`}>
        <LalaoMascot className="w-full h-full" />
      </div>
    );
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt}
      onError={handleError}
      className={`shrink-0 object-contain select-none ${className}`}
    />
  );
};
