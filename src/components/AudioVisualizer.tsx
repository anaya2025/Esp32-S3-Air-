import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  barCount = 36,
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const render = () => {
      audioEngine.getVisualizerData(dataArray);

      const width = canvas.width;
      const canvasHeight = canvas.height;
      ctx.clearRect(0, 0, width, canvasHeight);

      const barWidth = (width / barCount) - 2;
      const step = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        let rawVal = 0;
        if (isPlaying) {
          rawVal = dataArray[i * step] || 0;
          // Add a gentle musical baseline pulse when playing
          if (rawVal < 15) {
            rawVal = Math.sin((Date.now() / 200) + i * 0.3) * 8 + 12;
          }
        } else {
          // Idle ambient shimmer
          rawVal = 3;
        }

        const normalizedHeight = (rawVal / 255) * canvasHeight;
        const x = i * (barWidth + 2);
        const y = canvasHeight - normalizedHeight;

        // Gradient for AMOLED emerald/cyan theme
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');   // Emerald dim
        gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.9)'); // Emerald bright
        gradient.addColorStop(1, 'rgba(52, 211, 153, 1)');     // Mint peak

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(2, normalizedHeight), [2, 2, 0, 0]);
        ctx.fill();

        // Peak dot
        if (isPlaying && normalizedHeight > 8) {
          ctx.fillStyle = '#6ee7b7';
          ctx.fillRect(x, Math.max(0, y - 3), barWidth, 1.5);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, barCount]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full max-w-full"
      />
    </div>
  );
};
