import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExclamationTriangle } from 'react-icons/fa';
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

const AudioPlayer = ({ src, onEnded, getAudioRef, disableControls = false, onError, onPlay, onPause }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(7); // 7 seconds countdown

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const clipDurationRef = useRef<number>(7); // Giữ thời lượng clip là 7 giây

  // Mỗi khi src thay đổi, reset error state và countdown
  useEffect(() => {
    setHasError(false);
    setErrorCount(0);
    setRemainingTime(7);
    clipDurationRef.current = 7;

    console.log('Audio src changed to:', src);

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
      setDuration(7); // Always set to 7 seconds
      setHasError(false);
      console.log('Audio loaded successfully');
    };

    const setAudioTime = () => {
      if (audio.currentTime <= audio.currentTime + clipDurationRef.current) {
        setCurrentTime(audio.currentTime);

        // Tính toán thời gian còn lại từ thời điểm bắt đầu
        const elapsedTime = audio.currentTime - audio.startTime;
        const timeLeft = Math.max(0, Math.ceil(clipDurationRef.current - elapsedTime));
        setRemainingTime(timeLeft);

        // Dừng audio sau khi phát đủ 7 giây
        if (elapsedTime >= clipDurationRef.current && isPlaying) {
          audio.pause();
          if (onPause) onPause();
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Lưu thời điểm bắt đầu phát
      audio.startTime = audio.currentTime;
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setHasError(true);
      setIsPlaying(false);

      // Tăng số lần lỗi
      setErrorCount(prev => {
        const newCount = prev + 1;
        if (newCount === 1) {
          toast.error('Không thể phát nhạc. Vui lòng thử lại!');
          if (onError) onError();
        }
        return newCount;
      });
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [src, onEnded, getAudioRef, onError, onPlay, onPause]);

  // Animate visualizer bars with reduced update frequency
  useEffect(() => {
    if (!isPlaying) return;

    const animateVisualizer = (timestamp: number) => {
      // Only update visualizer every 100ms to reduce flickering but keep it active
      if (timestamp - lastUpdateTimeRef.current > 100) {
        const newHeights = visualizerHeights.map(() => {
          // Tạo chiều cao ngẫu nhiên từ 5-40px để tạo hiệu ứng nhảy nhạc
          return Math.floor(Math.random() * 35) + 5;
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
  }, [isPlaying, visualizerHeights]);

  const togglePlay = () => {
    if (disableControls || hasError) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Failed to play:', err);
        setHasError(true);
        toast.error('Không thể phát nhạc. Vui lòng thử lại!');
      });
    }
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
      <div className="text-center text-2xl font-bold text-accent">
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
