# Backend for Music Guessing Game

## Description
This is the backend for the Music Guessing Game, which includes APIs for managing songs and users.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/music-guessing-game.git
   cd music-guessing-game/backend

## MongoDB Atlas Setup

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (the free tier works fine)
3. In the Security section, create a database user with read/write privileges
4. In the Network Access section, add your IP address or allow access from anywhere (for development)
5. Go to Database > Connect > Connect your application
6. Copy the connection string
7. Update the `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.ivoeeaa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
8. Replace `<db_username>` and `<db_password>` with your actual MongoDB Atlas credentials

## Running the Application
