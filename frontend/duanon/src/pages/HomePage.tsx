import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMusic, FaPlay, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import config from '../config';

const HomePage = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setScore } = useGame();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên của bạn!');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = config.API_URL;
      const response = await axios.post(`${API_URL}/users/create`, { name });

      setUser({
        name,
        score: response.data.score || 0,
      });

      setScore(response.data.score || 0);
      toast.success('Đăng nhập thành công!');
      navigate('/play');

    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' &&
          'status' in error.response && error.response.status === 400) {
        // User already exists, try to get their score
        try {
          const leaderboardResponse = await axios.get(`${config.API_URL}/users/leaderboard`);
          interface LeaderboardUser {
            name: string;
            score: number;
          }
          const existingUser = leaderboardResponse.data.find((user: LeaderboardUser) => user.name === name);

          if (existingUser) {
            setUser({
              name,
              score: existingUser.score,
            });

            setScore(existingUser.score);
            toast.info('Đăng nhập với tài khoản hiện có!');
            navigate('/play');
            return;
          }
        } catch (err) {
          console.error('Error fetching leaderboard:', err);
        }
      }

      toast.error('Đăng nhập thất bại. Vui lòng thử lại!');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-primary">Đoán</span>{' '}
          <span className="text-accent">Nhạc</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Thử thách khả năng nghe nhạc của bạn! Nghe một đoạn nhạc ngắn và đoán tên bài hát chính xác.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card flex flex-col items-center justify-center p-8"
        >
          <FaMusic className="text-7xl text-primary mb-6" />
          <h2 className="text-2xl font-bold mb-4">Cách Chơi</h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-start">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
              <span>Đăng nhập với tên của bạn</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
              <span>Nghe một đoạn nhạc ngắn</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
              <span>Chọn đáp án đúng từ các lựa chọn</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">4</span>
              <span>Ghi điểm cao và lên bảng xếp hạng!</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Bắt Đầu Chơi Ngay</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-300 mb-2">
                Tên của bạn
              </label>
              <input
                type="text"
                id="name"
                className="input"
                placeholder="Nhập tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-accent w-full flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Đang xử lý...</span>
              ) : (
                <>
                  <FaUserPlus className="mr-2" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/play')}
              className="btn btn-primary flex items-center justify-center mx-auto"
            >
              <FaPlay className="mr-2" />
              Chơi Ngay Không Cần Đăng Nhập
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Điểm số của bạn sẽ không được lưu lại nếu không đăng nhập
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
