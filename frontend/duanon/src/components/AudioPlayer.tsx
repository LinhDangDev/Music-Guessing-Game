import { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute, FaExclamationTriangle, FaPlayCircle } from 'react-icons/fa';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0); // Lưu thời điểm bắt đầu phát
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<number>(0);
  const maxRetries = 3;

  // Reset state when src changes
  useEffect(() => {
    console.log('Audio src changed to:', src);
    setHasError(false);
    setRemainingTime(7);
    setIsLoaded(false);
    setIsReadyToPlay(false);
    startTimeRef.current = 0;
    retryRef.current = 0;

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

    return () => {
      // Cleanup when component unmounts or src changes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]);

  // Setup event listeners for the audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Provide audio reference to parent component if needed
    if (getAudioRef) {
      getAudioRef(audio);
    }

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded successfully');
      setIsLoaded(true);
      setIsReadyToPlay(true);
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded, ready to play');
      setIsLoaded(true);

      // Try to play automatically if not already playing
      if (!isPlaying && audioRef.current && isReadyToPlay) {
        playAudio();
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsReadyToPlay(true);

      // Try to play automatically if loaded
      if (!isPlaying && audioRef.current && isLoaded) {
        playAudio();
      }
    };

    const handlePlay = () => {
      console.log('Audio play event triggered');
      setIsPlaying(true);

      // Store the current playback position
      startTimeRef.current = audio.currentTime;

      // Start 7-second countdown
      setRemainingTime(7);

      // Set timer for countdown
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;

          // If countdown reaches 0, stop playback and clear timer
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

      // Set timer to stop audio after 7 seconds
      setTimeout(() => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      }, 7000);

      if (onPlay) onPlay();
    };

    const handlePause = () => {
      console.log('Audio pause event triggered');
      setIsPlaying(false);

      // Stop countdown when audio is paused
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onPause) onPause();
    };

    const handleEnded = () => {
      console.log('Audio ended event triggered');
      setIsPlaying(false);

      // Stop countdown when audio ends
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);

      // If there are retries left, try loading again
      if (retryRef.current < maxRetries) {
        console.log(`Retrying audio load (${retryRef.current + 1}/${maxRetries})...`);
        retryRef.current++;

        // Small delay before retrying
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 1000);

        return;
      }

      // If max retries reached, show error
      setHasError(true);
      setIsPlaying(false);
      setIsLoaded(false);
      setIsReadyToPlay(false);

      // Stop countdown when there's an error
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (onError) onError();
      toast.error('Không thể phát nhạc. Vui lòng thử lại!');
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Clean up event listeners
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src, getAudioRef, onEnded, onError, onPlay, onPause, isLoaded, isPlaying, isReadyToPlay]);

  // Attempt to play the audio when it's ready
  useEffect(() => {
    if (isLoaded && isReadyToPlay && audioRef.current && !isPlaying) {
      playAudio();
    }
  }, [isLoaded, isReadyToPlay, isPlaying]);

  // Animate visualizer bars
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
  }, [isPlaying, visualizerHeights.length]);

  // Function to play the audio with proper error handling
  const playAudio = () => {
    if (!audioRef.current) return;

    try {
      // Make sure we're at the right starting position
      if (audioRef.current.duration) {
        // Don't set currentTime if we're already playing
        if (!isPlaying) {
          audioRef.current.currentTime = startTimeRef.current;
        }
      }

      // Use a promise to catch any play() errors
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
          })
          .catch(err => {
            console.error('Playback error:', err);
            // Show play button if autoplay is prevented
            setIsPlaying(false);
          });
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleManualPlay = () => {
    if (isLoaded && audioRef.current) {
      playAudio();
    }
  };

  // Show error state
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
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        crossOrigin="anonymous"
      />

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

      {/* Controls */}
      <div className="flex justify-between items-center mt-4">
        {!isPlaying && isLoaded && (
          <button
            onClick={handleManualPlay}
            className="btn-primary rounded-full p-3"
            title="Phát nhạc"
          >
            <FaPlayCircle className="text-2xl" />
          </button>
        )}

        {!isPlaying && !isLoaded && (
          <div className="text-sm text-gray-400">Đang tải nhạc...</div>
        )}

        <div className="flex-grow"></div>

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
