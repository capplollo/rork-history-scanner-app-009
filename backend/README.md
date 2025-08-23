# Backend API Server Setup

This is a secure backend API server that handles OpenAI API calls for the Rork History Scanner App.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create .env file:**
   Create a `.env` file in the backend directory with:
   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

4. **Test the server:**
   Visit `http://localhost:3001/health` to check if the server is running.

## API Endpoints

- `GET /health` - Health check
- `POST /api/openai/chat` - General chat completion
- `POST /api/openai/analyze-image` - Image analysis with vision

## Security Benefits

- ✅ API keys stored securely on server
- ✅ No client-side API key exposure
- ✅ Centralized error handling
- ✅ Rate limiting capability
- ✅ Better logging and monitoring
