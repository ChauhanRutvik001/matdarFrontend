# 🌐 MongoDB Atlas Cloud Database Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to **https://www.mongodb.com/cloud/atlas/register**
2. Sign up for a **FREE account** (no credit card required)
3. Verify your email address

## Step 2: Create a Free Cluster

1. After logging in, click **"Build a Database"**
2. Choose **FREE** tier (M0 Sandbox - 512 MB storage)
3. Select a **Cloud Provider & Region**:
   - Choose the region closest to you (e.g., AWS Mumbai for India)
4. Click **"Create Cluster"** (takes 1-3 minutes)

## Step 3: Create Database User

1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username**: `admin` (or any username you want)
   - **Password**: Create a strong password (save it!)
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

## Step 4: Allow Network Access

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - This adds `0.0.0.0/0` to whitelist
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver**: Node.js
   - **Version**: 4.1 or later
5. Copy the connection string (looks like this):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File

1. Open `server/.env`
2. **Replace** `<password>` with your actual database password
3. **Add** `/number-tracker` before the `?` to specify database name
4. Example:
   ```env
   # Comment out local database
   # MONGODB_URI=mongodb://localhost:27017/number-tracker

   # Use MongoDB Atlas cloud database
   MONGODB_URI=mongodb+srv://admin:YourPassword123@cluster0.xxxxx.mongodb.net/number-tracker?retryWrites=true&w=majority

   PORT=5000
   ```

## Step 7: Test Connection

1. Restart your server:
   ```bash
   cd server
   node server.js
   ```

2. You should see:
   ```
   ✅ MongoDB connected successfully
   📍 Database: Cloud (MongoDB Atlas)
   Server running on port 5000
   ```

## Step 8: Migrate Existing Data (Optional)

If you want to move your local data to cloud:

### Option A: Using MongoDB Compass (GUI)
1. Download **MongoDB Compass**: https://www.mongodb.com/try/download/compass
2. Connect to **local** database: `mongodb://localhost:27017`
3. Export your `number-tracker` database
4. Connect to **Atlas** using your connection string
5. Import the data

### Option B: Using mongodump/mongorestore (CLI)
```bash
# Export from local
mongodump --db number-tracker --out ./backup

# Import to Atlas (replace with your connection string)
mongorestore --uri "mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net" --db number-tracker ./backup/number-tracker
```

## ✅ Benefits of Cloud Database

- ✅ **Access from anywhere** - Your data is online
- ✅ **No local MongoDB installation needed**
- ✅ **Automatic backups**
- ✅ **Free 512MB storage**
- ✅ **Better security**
- ✅ **Share with team members**

## 🔒 Security Tips

1. **Never commit** your connection string to GitHub
2. Always use **.env** file for credentials
3. Use **strong passwords** for database users
4. For production, restrict IP addresses instead of allowing all

## 🆘 Troubleshooting

**Error: "Authentication failed"**
- Check your username and password
- Make sure you replaced `<password>` in connection string

**Error: "Connection timeout"**
- Check Network Access settings in Atlas
- Make sure your IP is whitelisted

**Error: "Database user not found"**
- Create a database user in Database Access section

## Need Help?

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com
- Support: https://www.mongodb.com/support
