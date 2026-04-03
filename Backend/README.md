# Portfolio Backend API

Backend server for the Portfolio Project built with Node.js and Express.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env` file and configure your settings
   - Update `PORT` and other variables as needed

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Base Routes
- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint
- `GET /api/info` - API information

## Project Structure

```
Backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
├── .gitignore        # Git ignore rules
└── README.md         # Documentation
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with nodemon for development
- `npm test` - Run tests (to be implemented)

## Technologies

- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload (dev dependency)
