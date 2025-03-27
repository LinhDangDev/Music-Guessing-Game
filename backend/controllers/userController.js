const User = require('../models/User');

const createUser = async (req, res) => {
  const { name, score } = req.body;

  try {
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên người chơi đã tồn tại' });
    }

    const newUser = new User({ name, score });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ score: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserScore = async (req, res) => {
  const { name, score } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { score } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Người chơi không tồn tại' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createUser, getLeaderboard, updateUserScore };
