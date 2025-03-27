import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaPlay, FaHome, FaRedo } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';

interface LeaderboardUser {
  name: string;
  score: number;
}

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, setScore, submitScore } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching leaderboard from:', `${config.API_URL}/users/leaderboard`);
      const response = await axios.get(`${config.API_URL}/users/leaderboard`);
      console.log('Leaderboard data:', response.data);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Không thể tải bảng xếp hạng. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    // Reset điểm về 0
    setScore(0);

    // Nếu đang đăng nhập, gọi API cập nhật điểm về 0
    if (user) {
      submitScore();
    }

    // Chuyển đến trang chơi game
    navigate('/play');
  };

  const goToHome = () => {
    navigate('/');
  };

  const getUserRank = () => {
    if (!user) return null;

    const userIndex = leaderboard.findIndex(item => item.name === user.name);
    return userIndex !== -1 ? userIndex + 1 : null;
  };

  const userRank = getUserRank();

  return (
    <div className="max-w-3xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <FaTrophy className="inline-block mr-2 text-yellow-500" />
          Bảng Xếp Hạng
        </h1>
        {user && userRank && (
          <p className="text-lg text-gray-300 mt-2">
            Xếp hạng của bạn: <span className="text-accent font-bold">#{userRank}</span> với <span className="text-accent font-bold">{user.score}</span> điểm
          </p>
        )}
      </motion.div>

      <div className="card overflow-hidden">
        <div className="bg-primary/20 p-4 font-medium grid grid-cols-12 text-center">
          <div className="col-span-2">Xếp hạng</div>
          <div className="col-span-7 text-left">Tên người chơi</div>
          <div className="col-span-3">Điểm số</div>
        </div>

        {isLoading ? (
          <div className="text-center p-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Đang tải bảng xếp hạng...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {leaderboard.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 grid grid-cols-12 items-center text-center ${
                  user && item.name === user.name ? 'bg-primary/10' : ''
                }`}
              >
                <div className="col-span-2">
                  {index < 3 ? (
                    <span className={`text-xl ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' : 'text-yellow-700'
                    }`}>
                      <FaTrophy />
                    </span>
                  ) : (
                    <span className="font-bold">#{index + 1}</span>
                  )}
                </div>
                <div className="col-span-7 text-left font-medium">
                  {item.name}
                  {user && item.name === user.name && (
                    <span className="ml-2 text-xs bg-accent text-white px-2 py-0.5 rounded-full">Bạn</span>
                  )}
                </div>
                <div className="col-span-3 font-bold text-accent">{item.score}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <p>Chưa có dữ liệu bảng xếp hạng.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <button
          onClick={handlePlayAgain}
          className="btn btn-primary flex items-center justify-center"
        >
          <FaPlay className="mr-2" />
          Chơi lại
        </button>

        <button
          onClick={() => fetchLeaderboard()}
          className="btn btn-secondary flex items-center justify-center"
        >
          <FaRedo className="mr-2" />
          Làm mới bảng xếp hạng
        </button>

        <button
          onClick={goToHome}
          className="btn btn-outline flex items-center justify-center"
        >
          <FaHome className="mr-2" />
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default LeaderboardPage;
