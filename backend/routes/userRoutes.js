const express = require('express');
const { createUser, getLeaderboard, updateUserScore } = require('../controllers/userController');
const router = express.Router();

router.post('/create', createUser);
router.get('/leaderboard', getLeaderboard);
router.put('/update-score', updateUserScore);

module.exports = router;
