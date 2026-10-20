import React from 'react';

interface WaveformVisualizerProps {
  waveform?: number[];
  isPlaying?: boolean;
  progress?: number; // 0 to 1
  onSeek?: (progress: number) => void;
  barCount?: number;
  height?: number;
  color?: string;
  activeColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveform,
  isPlaying = false,
  progress = 0,
  onSeek,
  barCount = 36,
  height = 36,
  color = 'bg-white/20',
  activeColor = 'bg-[#5E43F3]',
}) => {
  // Generate fallback peaks if none provided
  const bars = React.useMemo(() => {
    if (waveform && waveform.length > 0) {
      if (waveform.length === barCount) return waveform;
      // resample
      const res: number[] = [];
      const step = waveform.length / barCount;
      for (let i = 0; i < barCount; i++) {
        const idx = Math.min(waveform.length - 1, Math.floor(i * step));
        res.push(waveform[idx]);
      }
      return res;
    }
    // Default pseudo-random aesthetic waveform
    return Array.from({ length: barCount }, (_, i) => {
      const sine = Math.sin((i / barCount) * Math.PI * 3);
      const val = 0.25 + 0.65 * Math.abs(sine * Math.cos(i * 0.7));
      return Math.max(0.18, Math.min(1, val));
    });
  }, [waveform, barCount]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newProgress);
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative flex items-center gap-[2.5px] w-full select-none ${
        onSeek ? 'cursor-pointer hover:opacity-90' : ''
      }`}
      style={{ height }}
    >
      {bars.map((bar, idx) => {
        const barProgress = idx / bars.length;
        const isPassed = barProgress <= progress;
        const barHeight = Math.max(4, Math.round(bar * height));

        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center transition-all duration-75"
            style={{ height: '100%' }}
          >
            <div
              className={`w-full rounded-full transition-all duration-150 ${
                isPassed ? activeColor : color
              } ${isPlaying && isPassed ? 'scale-y-110' : ''}`}
              style={{
                height: `${barHeight}px`,
                minWidth: '2px',
                maxWidth: '4px',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
