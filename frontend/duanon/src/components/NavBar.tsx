import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { FaMusic, FaTrophy, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

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

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, score } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<() => void>(() => {});
  const [modalMessage, setModalMessage] = useState("");

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-accent' : 'text-gray-300 hover:text-white';
  };

  const isPlayingGame = location.pathname === '/play';

  const handleNavigationClick = (e: React.MouseEvent, destination: string, message: string) => {
    if (isPlayingGame) {
      e.preventDefault();
      setModalMessage(message);
      setModalAction(() => () => navigate(destination));
      setShowModal(true);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    handleNavigationClick(
      e,
      '/',
      "Bạn đang trong quá trình chơi game. Nếu về trang chủ, tiến trình chơi sẽ bị mất. Bạn có chắc chắn muốn tiếp tục?"
    );
  };

  const handleLeaderboardClick = (e: React.MouseEvent) => {
    handleNavigationClick(
      e,
      '/leaderboard',
      "Bạn đang trong quá trình chơi game. Nếu chuyển sang xem bảng xếp hạng, tiến trình chơi sẽ bị mất. Bạn có chắc chắn muốn tiếp tục?"
    );
  };

  return (
    <nav className="bg-surface shadow-lg">
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

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <a
            href="/"
            onClick={handleHomeClick}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <FaMusic className="text-accent text-2xl" />
            <span className="text-2xl font-bold">Đoán Nhạc</span>
          </a>

          <div className="flex items-center space-x-6">
            <a
              href="/leaderboard"
              onClick={handleLeaderboardClick}
              className={`flex items-center space-x-1 ${isActive('/leaderboard')}`}
            >
              <FaTrophy />
              <span>Xếp Hạng</span>
            </a>
          </div>

          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Xin chào, {user.name}</span>
              <span className="bg-accent px-2 py-1 rounded text-white font-bold">
                {score} điểm
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
