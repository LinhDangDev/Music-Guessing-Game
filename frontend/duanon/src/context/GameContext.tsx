import { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config';

// Define types
interface User {
  name: string;
  score: number;
}

interface SongOption {
  title: string;
  artist: string;
}

interface GameContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  score: number;
  setScore: (score: number) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentClip: string | null;
  setCurrentClip: (currentClip: string | null) => void;
  clipStartPercent: number | null;
  setClipStartPercent: (percent: number | null) => void;
  clipDuration: number | null;
  setClipDuration: (duration: number | null) => void;
  options: SongOption[];
  setOptions: (options: SongOption[]) => void;
  correctAnswer: SongOption | null;
  setCorrectAnswer: (correctAnswer: SongOption | null) => void;
  fetchRandomClip: () => Promise<void>;
  submitScore: (newScore?: number) => Promise<void>;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClip, setCurrentClip] = useState<string | null>(null);
  const [clipStartPercent, setClipStartPercent] = useState<number | null>(null);
  const [clipDuration, setClipDuration] = useState<number | null>(null);
  const [options, setOptions] = useState<SongOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<SongOption | null>(null);

  const API_URL = config.API_URL;

  const fetchRandomClip = async () => {
    try {
      console.log('Fetching random clip from:', `${API_URL}/songs/random-clip`);
      const response = await axios.get(`${API_URL}/songs/random-clip`);
      console.log('Clip response:', response.data);

      // Ensure clipUrl is a full URL
      const clipUrl = response.data.clipUrl;
      setCurrentClip(clipUrl);

      // Lưu thông tin về thời điểm bắt đầu và thời lượng clip
      setClipStartPercent(response.data.clipStartPercent || 0);
      setClipDuration(response.data.clipDuration || 7);

      // Set options/choices
      if (response.data.choices && Array.isArray(response.data.choices)) {
        setOptions(response.data.choices);

        // Find the correct answer
        const correctOption = response.data.choices.find(
          (choice: SongOption & { id: string }) => choice.id === response.data.correctAnswerId
        );
        setCorrectAnswer(correctOption);
      } else {
        console.error('Invalid response format - choices not found or not an array');
        toast.error('Định dạng dữ liệu không hợp lệ. Vui lòng thử lại!');
        return;
      }
    } catch (error) {
      console.error('Error fetching random clip:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });

        // Hiển thị thông báo lỗi chi tiết hơn
        if (error.response?.status === 404) {
          toast.error('Không tìm thấy bài hát. Vui lòng thử lại!');
        } else if (error.message.includes('Network Error')) {
          toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet!');
        } else {
          toast.error(`Lỗi khi tải nhạc: ${error.message}`);
        }
      } else {
        toast.error('Không thể tải nhạc. Vui lòng thử lại!');
      }

      // Ném lỗi để component gọi có thể xử lý
      throw error;
    }
  };

  const submitScore = async (newScore?: number) => {
    if (!user) {
      console.log('No user logged in, skipping score submission');
      return;
    }

    // Sử dụng điểm được truyền vào hoặc điểm hiện tại từ state
    const scoreToSubmit = newScore !== undefined ? newScore : score;

    try {
      console.log(`Submitting score ${scoreToSubmit} for user ${user.name}`);
      await axios.put(`${API_URL}/users/update-score`, {
        name: user.name,
        score: scoreToSubmit,
      });
      console.log('Score submitted successfully');
      // toast.success('Score saved successfully!');
    } catch (error) {
      console.error('Error submitting score:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      toast.error('Không thể lưu điểm. Vui lòng thử lại!');
    }
  };

  const value = {
    user,
    setUser,
    score,
    setScore,
    isPlaying,
    setIsPlaying,
    currentClip,
    setCurrentClip,
    clipStartPercent,
    setClipStartPercent,
    clipDuration,
    setClipDuration,
    options,
    setOptions,
    correctAnswer,
    setCorrectAnswer,
    fetchRandomClip,
    submitScore,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
