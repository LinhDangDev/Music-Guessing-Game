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
  const { user } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching leaderboard from:', `${config.API_URL}/users/leaderboard`);

      // Đảm bảo rằng API_URL được sử dụng đúng cách
      const API_URL = config.API_URL;
      const response = await axios.get(`${API_URL}/users/leaderboard`);

      console.log('Leaderboard data:', response.data);

      if (Array.isArray(response.data)) {
        // Sắp xếp dữ liệu theo điểm số giảm dần để đảm bảo hiển thị đúng thứ tự
        const sortedData = [...response.data].sort((a, b) => b.score - a.score);
        setLeaderboard(sortedData);
      } else {
        console.error('Invalid leaderboard data format:', response.data);
        toast.error('Định dạng dữ liệu không hợp lệ. Vui lòng thử lại!');
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // Thử truy cập API với đường dẫn khác nếu gặp lỗi 404 hoặc đường dẫn không đúng
        if (error.response?.status === 404 || error.message.includes('Network Error')) {
          toast.error('Không thể kết nối đến máy chủ. Đảm bảo bạn đã kết nối internet!');
        } else {
          toast.error(`Lỗi: ${error.message}`);
        }
      } else {
        toast.error('Không thể tải bảng xếp hạng. Vui lòng thử lại sau!');
      }

      // Set empty array to avoid displaying old data
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    // Chuyển trực tiếp đến trang chơi ngay cả khi chưa đăng nhập
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
        {!user && (
          <p className="text-lg text-gray-300 mt-2">
            Hãy đăng nhập để có thể ghi điểm và xuất hiện trong bảng xếp hạng!
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
          {user ? "Chơi lại" : "Bắt đầu chơi"}
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
