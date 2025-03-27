# Music Guessing Game

A game where you guess the song from a short 7-second clip.

## Project Structure

- `backend/`: Node.js server with Express, MongoDB, and API
- `frontend/`: React frontend (to be built later)
- `music/`: Directory containing MP3 music files
  - `Youtube/`: Songs from YouTube
  - `Soundcloud/`: Songs from SoundCloud

## Requirements

- Node.js (v16+)
- MongoDB
- ffmpeg (installed via ffmpeg-static)

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/music-guessing-game.git
cd music-guessing-game
```

2. Install dependencies
```bash
cd backend
npm install
```

3. Create a `.env` file
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/music_guessing
JWT_SECRET=your_jwt_secret_key_here
```

4. Create directories for music files
```bash
mkdir -p music/Youtube music/Soundcloud
```

5. Add MP3 files to the `music/Youtube` and `music/Soundcloud` directories.

## Running the Application

1. Start MongoDB
```bash
# Windows
# Ensure MongoDB is installed and running

# Linux/Mac
sudo service mongodb start
# or
mongod --dbpath=/path/to/data
```

2. Run the backend server
```bash
cd backend
npm run dev
```

3. Access the API test endpoint
```
http://localhost:5000/api
```

## API Endpoints

- `GET /api/songs`: Get a list of all songs
- `GET /api/songs/random-clip`: Get a random 7-second clip and answer choices

## Workflow

1. The server scans the music directories and saves the information to MongoDB.
2. The API returns a random music clip and answer choices to the player.
3. The player listens to the clip and selects the correct answer.

## Key Libraries Used

- Express: Web server
- Mongoose: MongoDB ORM
- ffmpeg-static: Audio file processing
- fluent-ffmpeg: Wrapper for ffmpeg
