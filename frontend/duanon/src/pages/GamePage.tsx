import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaPlay, FaRedo, FaMusic, FaCheckCircle, FaTimesCircle, FaTrophy, FaHome, FaTimes } from 'react-icons/fa';
import { useGame } from '../context/GameContext';
import AudioPlayer from '../components/AudioPlayer';
import { useNavigate } from 'react-router-dom';

// Confetti component for celebration when getting correct answer
const Confetti = () => {
  const pieces = Array.from({ length: 50 }).map((_, i) => {
    const style = {
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 0.5}s`,
      left: `${Math.random() * 100}vw`,
      backgroundColor: [
        '#f43f5e', // accent
        '#4f46e5', // primary
        '#8b5cf6', // secondary
        '#f59e0b', // yellow
        '#10b981', // green
      ][Math.floor(Math.random() * 5)],
      width: `${Math.random() * 10 + 5}px`,
      height: `${Math.random() * 10 + 5}px`,
    };

    return (
      <div
        key={i}
        style={{
          position: 'fixed',
          top: 0,
          zIndex: 50,
          animation: 'confetti-fall',
          ...style,
        }}
      />
    );
  });

  return <div className="confetti">{pieces}</div>;
};

// Modal xác nhận
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">Xác nhận</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <p className="mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
          >
            Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface SongOption {
  title: string;
  artist: string;
}

const QUESTIONS_PER_GAME = 10;

const GamePage = () => {
  const navigate = useNavigate();
  const {
    user,
    score,
    setScore,
    currentClip,
    setCurrentClip,
    options,
    correctAnswer,
    fetchRandomClip,
    submitScore,
  } = useGame();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  // Ref để theo dõi timer từ setInterval
  const countdownTimerRef = useRef<number | null>(null);

  // State cho confirm modal
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<() => void>(() => {});
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadNewClip();

    // Cleanup function khi component unmount
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      // Dừng audio và reset trạng thái khi rời khỏi trang
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // Tự động phát nhạc khi clip mới được tải
  useEffect(() => {
    if (currentClip && audioPlayerRef.current) {
      // Đặt timeout để đảm bảo audio đã được load
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.play().catch(err => {
            console.log('Auto-play prevented:', err);
            // Thông báo cho người dùng nếu trình duyệt chặn autoplay
            toast.info('Nhạc sẽ tự động phát...');
          });
        }
      }, 300);
    }
  }, [currentClip]);

  const loadNewClip = async () => {
    // Reset các state trước khi load clip mới
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    // Kiểm tra nếu đã hoàn thành tất cả câu hỏi
    // Cần so sánh questionCount với QUESTIONS_PER_GAME trước khi tăng
    if (questionCount > QUESTIONS_PER_GAME) {
      setGameOver(true);
      // Xóa clip hiện tại để tránh tiếp tục phát nhạc
      setCurrentClip(null);
      return;
    }

    setIsLoading(true);
    setSelectedOption(null);
    setResult(null);
    setCountdown(null);

    try {
      await fetchRandomClip();
    } catch (error) {
      console.error('Error loading clip:', error);
      toast.error('Không thể tải nhạc. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: SongOption) => {
    if (result || isLoading || selectedOption) return;

    // Dừng phát audio hiện tại
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    setSelectedOption(option.title);

    if (correctAnswer && option.title === correctAnswer.title && option.artist === correctAnswer.artist) {
      setResult('correct');
      setShowConfetti(true);

      // Cập nhật điểm ngay lập tức trên UI
      const newScore = score + 10;
      setScore(newScore);

      // Lưu điểm vào context
      if (user) {
        // Đảm bảo cập nhật điểm trước khi gọi API
        submitScore(newScore);
      }

      toast.success('Chính xác! +10 điểm');
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    } else if (correctAnswer) {
      setResult('incorrect');
      toast.error(`Sai rồi! Đáp án đúng là: ${correctAnswer.title} - ${correctAnswer.artist}`);
    }

    // Kiểm tra nếu đây là câu hỏi cuối cùng
    if (questionCount === QUESTIONS_PER_GAME) {
      // Nếu đây là câu hỏi cuối, chờ vài giây rồi kết thúc game
      setCountdown(3);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            setGameOver(true);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return;
    }

    // Tự động chuyển sang câu hỏi mới sau 3 giây
    setCountdown(3);

    // Lưu trữ tham chiếu đến timer để có thể clear nếu cần
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          // Tăng số câu hỏi và kiểm tra nếu vượt quá giới hạn
          const nextQuestionCount = questionCount + 1;
          setQuestionCount(nextQuestionCount);

          // Thêm timeout nhỏ để đảm bảo UI đã cập nhật trước khi load clip mới
          setTimeout(() => {
            loadNewClip();
          }, 100);

          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const restartGame = () => {
    // Reset điểm về 0
    setScore(0);

    // Nếu đang đăng nhập, gọi API cập nhật điểm về 0
    if (user) {
      submitScore(0);
    }

    setQuestionCount(1);
    setGameOver(false);

    // Thêm delay nhỏ để đảm bảo state đã cập nhật
    setTimeout(() => {
      loadNewClip();
    }, 100);
  };

  const handleGoHome = () => {
    if (gameOver) {
      // Nếu đã kết thúc game, chuyển trực tiếp về trang chủ
      goHome();
    } else {
      // Nếu đang chơi, hiển thị xác nhận
      setModalMessage('Bạn có chắc muốn dừng trò chơi và quay về trang chủ không?');
      setModalAction(() => goHome);
      setShowModal(true);
    }
  };

  const handleGoToLeaderboard = () => {
    if (gameOver) {
      // Nếu đã kết thúc game, chuyển trực tiếp đến bảng xếp hạng
      navigate('/leaderboard');
    } else {
      // Nếu đang chơi, hiển thị xác nhận
      setModalMessage('Bạn có chắc muốn dừng trò chơi và xem bảng xếp hạng không?');
      setModalAction(() => () => navigate('/leaderboard'));
      setShowModal(true);
    }
  };

  const goHome = () => {
    // Dừng phát audio nếu đang phát
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    // Trở về trang chủ
    navigate('/');
  };

  // Tham chiếu audio để tự động phát
  const handleAudioRef = (audioElement: HTMLAudioElement) => {
    audioPlayerRef.current = audioElement;
  };

  const handleSkip = () => {
    if (isLoading || result !== null) return;

    // Dừng phát audio hiện tại
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    // Kiểm tra nếu đây là câu hỏi cuối cùng
    if (questionCount === QUESTIONS_PER_GAME) {
      setGameOver(true);
      return;
    }

    // Tăng số câu hỏi và kiểm tra nếu vượt quá giới hạn
    const nextQuestionCount = questionCount + 1;
    setQuestionCount(nextQuestionCount);

    // Thêm timeout nhỏ để đảm bảo UI đã cập nhật
    setTimeout(() => {
      loadNewClip();
    }, 100);
  };

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card p-8">
            <FaTrophy className="text-6xl text-accent mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Kết thúc trò chơi!</h1>
            <p className="text-xl mb-6">
              Điểm của bạn: <span className="text-accent font-bold text-2xl">{score}</span> / {QUESTIONS_PER_GAME * 10}
            </p>

            <div className="flex flex-col space-y-4">
              <button
                onClick={restartGame}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                <FaRedo className="mr-2" /> Chơi lại
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="btn btn-secondary w-full flex items-center justify-center"
              >
                <FaTrophy className="mr-2" /> Xem bảng xếp hạng
              </button>
              <button
                onClick={goHome}
                className="btn btn-outline w-full flex items-center justify-center"
              >
                <FaHome className="mr-2" /> Về trang chủ
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* Modal xác nhận */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          setShowModal(false);
          modalAction();
        }}
        message={modalMessage}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div
          className="cursor-pointer"
          onClick={handleGoHome}
        >
          <h1 className="text-4xl font-bold mb-2">
            <FaMusic className="inline-block mr-2" />
            Đoán Tên Bài Hát
          </h1>
        </div>
        <div className="flex justify-between items-center px-4">
          <p className="text-accent font-bold">
            Câu hỏi: {questionCount}/{QUESTIONS_PER_GAME}
          </p>
          <div className="flex items-center space-x-4">
            <p className="text-gray-300">
              {user && <span>Điểm: <span className="text-accent font-bold">{score}</span></span>}
            </p>
            <button
              onClick={handleGoToLeaderboard}
              className="text-gray-300 hover:text-accent"
              title="Bảng xếp hạng"
            >
              <FaTrophy />
            </button>
          </div>
        </div>
      </motion.div>

      {currentClip ? (
        <>
          <motion.div
            key={currentClip}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AudioPlayer
              src={`http://localhost:5000${currentClip}`}
              onEnded={() => {}}
              getAudioRef={handleAudioRef}
              disableControls={true} // Vô hiệu hóa nút điều khiển
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold mb-4">Chọn đáp án đúng:</h2>

            <div className="grid grid-cols-1 gap-3">
              {options.map((option, index) => {
                // Xác định đây có phải đáp án đúng không
                const isCorrectAnswer = correctAnswer &&
                  option.title === correctAnswer.title &&
                  option.artist === correctAnswer.artist;

                // Xác định xem người dùng đã chọn tùy chọn này chưa
                const isSelected = selectedOption === option.title;

                // Xác định lớp CSS dựa trên trạng thái
                let buttonClass = 'p-4 rounded-lg font-medium transition-all ';

                if (result) { // Nếu đã có kết quả
                  if (isCorrectAnswer) {
                    // Luôn hiển thị đáp án đúng với màu xanh lá
                    buttonClass += 'bg-green-600 text-white font-bold border-2 border-white';
                  } else if (isSelected) {
                    // Nếu người dùng chọn sai, hiển thị màu đỏ
                    buttonClass += 'bg-red-600 text-white';
                  } else {
                    // Các tùy chọn khác mờ đi
                    buttonClass += 'bg-surface/70 text-gray-300';
                  }
                } else {
                  // Trạng thái mặc định khi chưa chọn
                  buttonClass += 'bg-surface hover:bg-primary/20';
                }

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: result ? 1 : 1.02 }}
                    whileTap={{ scale: result ? 1 : 0.98 }}
                    onClick={() => handleOptionSelect(option)}
                    disabled={!!result || isLoading}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.title} - {option.artist}</span>

                      {result && isCorrectAnswer && (
                        <FaCheckCircle className="ml-2 text-white text-xl" />
                      )}

                      {result && isSelected && !isCorrectAnswer && (
                        <FaTimesCircle className="ml-2 text-white text-xl" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex justify-center mt-8">
            {result && countdown !== null ? (
              <div className="text-center">
                <p className="text-lg">Câu tiếp theo trong <span className="text-accent font-bold">{countdown}</span> giây</p>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                disabled={isLoading || result !== null}
                className="btn btn-primary flex items-center"
              >
                {isLoading ? (
                  <span className="animate-pulse">Đang tải...</span>
                ) : (
                  <>
                    <FaPlay className="mr-2" />
                    Bỏ qua
                  </>
                )}
              </motion.button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-12">
          <div className="animate-pulse-slow mb-4">
            <FaMusic className="text-5xl mx-auto text-primary" />
          </div>
          <p className="text-lg mb-4">Đang tải câu hỏi...</p>
          {isLoading && (
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default GamePage;
