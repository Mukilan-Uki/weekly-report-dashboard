# Weekly Report Generator & Team Dashboard

A full-stack application for generating weekly reports and displaying team dashboards.

## Project Structure

```
weekly-report-dashboard/
├── frontend/          # React + Vite frontend application
├── backend/           # Express.js backend server
└── README.md          # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- MongoDB (for database functionality)

## Installation

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

## Running the Application

### Running the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

### Running the Backend

From the `backend/` directory:

First, set up your environment variables by copying `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then start the server:

```bash
npm start
```

For development with auto-reload, use:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`.

### Running the Database

**Setup MongoDB (Placeholder)**

You can run MongoDB locally or use MongoDB Atlas (cloud):

1. **Local MongoDB:**
   - Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
   - Start the MongoDB service
   - Connect string: `mongodb://localhost:27017/weekly-report`

2. **MongoDB Atlas (Cloud):**
   - Create an account at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Update `MONGODB_URI` in your `.env` file

## Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Backend Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload (requires nodemon)

## API Endpoints

- `GET /` - Health check, returns `{ message: 'Backend running' }`
- `GET /health` - Server health status

## Environment Variables

### Backend (.env file)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weekly-report
NODE_ENV=development
```

## Development Workflow

1. Start the backend server in one terminal
2. Start the frontend dev server in another terminal
3. Open http://localhost:5173 in your browser

## Technology Stack

**Frontend:**
- React 18
- Vite
- JavaScript/JSX

**Backend:**
- Express.js
- Node.js
- MongoDB (Mongoose ODM)
- CORS
- Dotenv

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]
