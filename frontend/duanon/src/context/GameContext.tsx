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
  const [options, setOptions] = useState<SongOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<SongOption | null>(null);

  const API_URL = config.API_URL;

  const fetchRandomClip = async () => {
    try {
      const response = await axios.get(`${API_URL}/songs/random-clip`);
      setCurrentClip(response.data.clipUrl);
      setOptions(response.data.choices);
      const correctOption = response.data.choices.find(
        (choice: SongOption & { id: string }) => choice.id === response.data.correctAnswerId
      );
      setCorrectAnswer(correctOption);
    } catch (error) {
      console.error('Error fetching random clip:', error);
      toast.error('Failed to load audio clip. Please try again.');
    }
  };

  const submitScore = async (newScore?: number) => {
    if (!user) return;

    // Sử dụng điểm được truyền vào hoặc điểm hiện tại từ state
    const scoreToSubmit = newScore !== undefined ? newScore : score;

    try {
      await axios.put(`${API_URL}/users/update-score`, {
        name: user.name,
        score: scoreToSubmit,
      });
      // toast.success('Score saved successfully!');
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Failed to save score. Please try again.');
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
