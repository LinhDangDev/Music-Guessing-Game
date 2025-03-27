const User = require('../models/User');

const createUser = async (req, res) => {
  console.log('Create user request:', req.body);
  const { name, score } = req.body;

  if (!name) {
    console.log('Invalid request: name is required');
    return res.status(400).json({ message: 'Tên người chơi là bắt buộc' });
  }

  try {
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      console.log(`User already exists: ${name}`);
      return res.status(400).json({ message: 'Tên người chơi đã tồn tại', user: existingUser });
    }

    const newUser = new User({ name, score: score || 0 });
    await newUser.save();

    console.log(`New user created: ${name} with score ${newUser.score}`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLeaderboard = async (req, res) => {
  console.log('Getting leaderboard');
  try {
    const users = await User.find().sort({ score: -1 }).limit(10);
    console.log(`Leaderboard returned ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserScore = async (req, res) => {
  console.log('Update score request:', req.body);
  const { name, score } = req.body;

  if (!name || score === undefined) {
    console.log('Invalid request: name and score are required');
    return res.status(400).json({ message: 'Tên người chơi và điểm số là bắt buộc' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { score } },
      { new: true }
    );

    if (!user) {
      console.log(`User not found: ${name}`);
      return res.status(404).json({ message: 'Người chơi không tồn tại' });
    }

    console.log(`Updated user ${name}'s score to ${score}`);
    res.json(user);
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createUser, getLeaderboard, updateUserScore };
