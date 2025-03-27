import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  src: string;
  onEnded?: () => void;
  getAudioRef?: (audioElement: HTMLAudioElement) => void;
  disableControls?: boolean;
}

const AudioPlayer = ({ src, onEnded, getAudioRef, disableControls = false }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    // Generate initial visualizer bars
    const barCount = 20;
    const initialHeights = Array.from({ length: barCount }, () =>
      Math.floor(Math.random() * 30) + 5
    );
    setVisualizerHeights(initialHeights);

    // Reset player when src changes
    setIsPlaying(false);
    setCurrentTime(0);

    // Set event listeners
    const audio = audioRef.current;
    if (!audio) return;

    // Cung cấp tham chiếu audio cho component cha nếu có
    if (getAudioRef) {
      getAudioRef(audio);
    }

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [src, onEnded, getAudioRef]);

  // Animate visualizer bars with reduced update frequency
  useEffect(() => {
    if (!isPlaying) return;

    const animateVisualizer = (timestamp: number) => {
      // Only update visualizer every 200ms to reduce flickering
      if (timestamp - lastUpdateTimeRef.current > 200) {
        const newHeights = visualizerHeights.map((height) => {
          // Make changes more gradual (only change by up to 20% from current height)
          const change = Math.floor(Math.random() * 8) - 4;
          const newHeight = Math.max(5, Math.min(40, height + change));
          return newHeight;
        });

        setVisualizerHeights(newHeights);
        lastUpdateTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animateVisualizer);
    };

    animationRef.current = requestAnimationFrame(animateVisualizer);

    return () => {
      cancelAnimationFrame(animationRef.current!);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (disableControls) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const calculateProgress = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  return (
    <div className="card p-6 mt-6">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Fixed height container for visualizer */}
      <div className="visualizer mb-4" style={{ height: '45px', display: 'flex', alignItems: 'center' }}>
        {visualizerHeights.map((height, index) => (
          <div
            key={index}
            className="visualizer-bar"
            style={{
              height: isPlaying ? `${height}px` : '5px',
              backgroundColor: '#4f46e5',
              flex: 1,
              margin: '0 1px',
              borderRadius: '1px',
              transition: 'height 0.2s ease'
            }}
          />
        ))}
      </div>

      {/* Fixed height progress container */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-accent h-2 rounded-full transition-all duration-300"
          style={{ width: `${calculateProgress()}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        {!disableControls && (
          <button
            onClick={togglePlay}
            className="btn-primary rounded-full p-3"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        )}

        {disableControls && (
          <div className="w-10"></div>
        )}

        <div className="text-sm">
          {Math.floor(currentTime)} / {Math.floor(duration)} giây
        </div>

        <button
          onClick={toggleMute}
          className="btn-outline rounded-full p-3"
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
