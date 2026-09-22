import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width?: number;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content, isOpen, onClose, width = 240 }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [maxHeight, setMaxHeight] = useState(300);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        
        let newPos: 'bottom' | 'top' = 'bottom';
        let newMaxHeight = spaceBelow;

        if (spaceBelow < 250 && spaceAbove > spaceBelow) {
          newPos = 'top';
          newMaxHeight = spaceAbove;
        } else {
          newMaxHeight = spaceBelow;
        }

        setCoords({ top: rect.top, left: rect.left });
        setPosition(newPos);
        setMaxHeight(Math.max(200, newMaxHeight - 20)); // Ensure at least 200px max height
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true); // true for capture phase to catch scroll inside modals
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <div ref={triggerRef} className="inline-block relative">
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div 
            ref={popoverRef}
            className="fixed z-[99999] bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden"
            style={{
              width,
              left: Math.min(coords.left, window.innerWidth - width - 10), // Prevent bleeding off right edge
              ...(position === 'bottom' 
                  ? { top: coords.top + (triggerRef.current?.offsetHeight ?? 0) + 4 }
                  : { bottom: window.innerHeight - coords.top + 4 }
              ),
              maxHeight,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="overflow-y-auto flex-1 w-full" style={{ maxHeight }}>
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
