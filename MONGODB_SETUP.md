# Number Status Tracker - MongoDB Setup

## Prerequisites
- MongoDB installed locally or MongoDB Atlas account
- Node.js installed

## Setup Instructions

### 1. Install MongoDB (Local)
- Download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Configure MongoDB Connection
Edit `server/.env` file:
```
MONGODB_URI=mongodb://localhost:27017/number-tracker
PORT=5000
```

For MongoDB Atlas, use:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/number-tracker
PORT=5000
```

### 3. Start MongoDB (if using local)
```bash
mongod
```

### 4. Start Backend Server
```bash
cd server
npm run dev
```

The server will run on http://localhost:5000

### 5. Start Frontend
In a new terminal:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## API Endpoints

- `GET /api/numbers` - Fetch all numbers
- `PUT /api/numbers/:number` - Update a single number
- `PUT /api/numbers/bulk-update` - Bulk update multiple numbers
- `POST /api/numbers/sync` - Sync all data
- `DELETE /api/numbers/reset` - Delete all data

## Features
- ✅ MongoDB backend storage
- ✅ Auto-save on every change
- ✅ localStorage backup (fallback)
- ✅ Loading states
- ✅ Error handling
- ✅ Optimistic UI updates
