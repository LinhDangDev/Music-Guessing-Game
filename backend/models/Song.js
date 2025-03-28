const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['Youtube', 'Soundcloud', 'S3'],
    default: 'S3'
  },
  filePath: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    default: null
  },
  clipPath: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
