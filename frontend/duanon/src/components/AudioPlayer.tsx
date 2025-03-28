import { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface AudioPlayerProps {
  src: string;
  onEnded?: () => void;
  getAudioRef?: (audioElement: HTMLAudioElement) => void;
  disableControls?: boolean;
  onError?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

const AudioPlayer = ({ src, onEnded, getAudioRef, onError, onPlay, onPause }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([]);
  const [hasError, setHasError] = useState(false);
  const [remainingTime, setRemainingTime] = useState(7); // 7 seconds countdown

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0); // Lưu thời điểm bắt đầu phát
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mỗi khi src thay đổi, reset state
  useEffect(() => {
    setHasError(false);
    setRemainingTime(7);
    startTimeRef.current = 0;

    console.log('Audio src changed to:', src);

    // Generate initial visualizer bars
    const barCount = 20;
    const initialHeights = Array.from({ length: barCount }, () =>
      Math.floor(Math.random() * 30) + 5
    );
    setVisualizerHeights(initialHeights);

    // Reset player when src changes
    setIsPlaying(false);

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set event listeners
    const audio = audioRef.current;
    if (!audio) return;

    // Cung cấp tham chiếu audio cho component cha nếu có
    if (getAudioRef) {
      getAudioRef(audio);
    }

    const handlePlay = () => {
      setIsPlaying(true);

      // Lưu thời điểm bắt đầu phát vào ref
      startTimeRef.current = audio.currentTime;

      // Bắt đầu đếm ngược từ 7 giây
      setRemainingTime(7);

      // Đặt timer 1 giây để đếm ngược thời gian
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;

          // Nếu đếm về 0, dừng phát và xóa timer
          if (newTime <= 0) {
            if (audio && !audio.paused) {
              audio.pause();
            }

            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            return 0;
          }

          return newTime;
        });
      }, 1000);

      // Đặt timer để dừng audio sau 7 giây
      setTimeout(() => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      }, 7000);

      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);

      // Dừng đếm ngược khi audio bị pause
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onPause) onPause();
    };

    const handleEnded = () => {
      setIsPlaying(false);

      // Dừng đếm ngược khi audio kết thúc
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setHasError(true);
      setIsPlaying(false);

      // Dừng đếm ngược khi có lỗi
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onError) onError();
      toast.error('Không thể phát nhạc. Vui lòng thử lại!');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src, onEnded, getAudioRef, onError, onPlay, onPause]);

  // Animate visualizer bars with reduced update frequency
  useEffect(() => {
    if (!isPlaying) return;

    const animateVisualizer = (timestamp: number) => {
      // Update every 100ms for better visual effect
      if (timestamp - lastUpdateTimeRef.current > 100) {
        // Generate new random heights for each bar
        const newHeights = Array.from({ length: visualizerHeights.length }, () =>
          Math.floor(Math.random() * 35) + 5
        );

        setVisualizerHeights(newHeights);
        lastUpdateTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animateVisualizer);
    };

    animationRef.current = requestAnimationFrame(animateVisualizer);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Có lỗi khi phát nhạc
  if (hasError) {
    return (
      <div className="card p-6 mt-6 bg-red-900/20">
        <div className="flex items-center justify-center text-red-500 mb-4">
          <FaExclamationTriangle className="text-3xl" />
          <span className="ml-2 text-lg">Không thể phát nhạc</span>
        </div>
        <p className="text-center text-sm text-gray-300 mb-2">
          Vui lòng thử lại hoặc bỏ qua câu hỏi này
        </p>
      </div>
    );
  }

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
              transition: 'height 0.05s ease' // Rút ngắn thời gian transition
            }}
          />
        ))}
      </div>

      {/* Countdown timer */}
      <div className="text-center text-3xl font-bold text-red-500">
        {remainingTime} giây
      </div>

      {/* Volume control */}
      <div className="flex justify-end mt-2">
        <button
          onClick={toggleMute}
          className="btn-outline rounded-full p-3"
          disabled={hasError}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
