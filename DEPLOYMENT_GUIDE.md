# Deployment Guide for Music Guessing Game

## Backend Deployment on Render

1. Sign up for an account on [Render](https://render.com/)

2. Create a new Web Service:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository with your music guessing game

3. Configure the Web Service:
   - Name: `music-guessing-backend` (or any name you prefer)
   - Root Directory: `backend` (if your backend code is in a subdirectory)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. Set Environment Variables (under "Environment" tab):
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JSON Web Token secret
   - `NODE_ENV`: `production`

5. Create Disk Storage (under "Disks" tab):
   - Name: `music-data`
   - Mount Path: `/opt/render/project/src/music`
   - Size: At least 1 GB (adjust based on your music file needs)

6. Deploy your service by clicking "Create Web Service"

7. After deployment, upload your music files to the disk storage

## Frontend Deployment on Your Hosting

1. Build your frontend for production:
   ```bash
   cd frontend/duanon
   npm run build:prod
   ```

2. The build output will be in the `dist` directory.

3. Upload the contents of the `dist` directory to your web hosting:
   - Use FTP, SSH, or your hosting provider's file manager
   - Make sure to upload all files in the `dist` directory to your public HTML folder

4. If you're using a hosting provider that supports Node.js (like Vercel, Netlify):
   - Create a configuration file for your provider (like `netlify.toml` or `vercel.json`)
   - Set up proper redirects for React Router (if you're using it)

5. Configure your domain DNS settings if needed

## Connecting Frontend to Backend

1. Make sure the `VITE_API_BASE_URL` in your frontend points to your Render backend URL
   - For example: `https://music-guessing-backend.onrender.com/api`

2. Update the CORS settings in your backend's `index.js` file:
   - Add your frontend domain to the `corsOptions.origin` array

## Verifying Deployment

1. Test your backend API endpoint: `https://your-backend-url.onrender.com/api`
2. Access your frontend website and check if it can communicate with the backend
3. Test the music guessing game functionality

## Troubleshooting

- If your frontend cannot connect to the backend, check CORS settings
- If music files aren't loading, verify disk storage configuration on Render
- If authentication fails, check JWT_SECRET environment variable

## Updating Your Deployment

### Backend Updates
- Push changes to your GitHub repository
- Render will automatically redeploy your backend

### Frontend Updates
1. Make changes to your code
2. Run `npm run build:prod` again
3. Upload the new `dist` contents to your hosting

## Considerations for Production

- Enable HTTPS for both backend and frontend
- Set up proper monitoring and logging
- Consider setting up a CDN for better performance
- Implement proper error handling and fallbacks
