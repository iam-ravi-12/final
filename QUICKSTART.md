# Quick Start Guide

Get the Professional Network application up and running in minutes!

## Prerequisites Check

Before you begin, make sure you have:
- ✅ Java 17+ installed (`java -version`)
- ✅ MySQL 8.0+ installed and running
- ✅ Node.js 14+ installed (`node -v`)
- ✅ Maven 3.6+ installed (`mvn -v`)

## Step 1: Clone the Repository

```bash
git clone https://github.com/iam-ravi-12/final.git
cd final
```

## Step 2: Set Up MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE professional_network;

# Exit MySQL
EXIT;
```

## Step 3: Configure Database Connection

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

Or use environment variables (recommended):

```bash
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=your_mysql_password
```

## Step 4: Start the Backend

```bash
# Build and run
mvn spring-boot:run
```

Wait for the message: `Started ProfessionalNetworkApplication`

The backend is now running at: http://localhost:8080

## Step 5: Install Frontend Dependencies

Open a new terminal window:

```bash
cd frontend
npm install
```

## Step 6: Start the Frontend

```bash
npm start
```

The application will automatically open in your browser at: http://localhost:3000

## Step 7: Test the Application

1. **Sign Up**
   - Click "Sign up" on the login page
   - Enter username, email, and password
   - Click "Sign Up"

2. **Complete Profile**
   - Enter your profession (e.g., "Software Engineer")
   - Enter your organization (e.g., "Tech Corp")
   - Click "Complete Profile"

3. **Create Your First Post**
   - Click "+ Create Post"
   - Enter your message
   - Optionally check "Mark as Help Request"
   - Click "Post"

4. **Explore**
   - Browse "All Posts" to see posts from all users
   - Check "Professional" to see posts from your profession
   - Visit "Help Section" to see help requests

## Troubleshooting

### Backend won't start

**Problem:** `Communications link failure`
**Solution:** Make sure MySQL is running:
```bash
# Linux
sudo systemctl start mysql

# macOS
brew services start mysql

# Windows - start MySQL from Services
```

**Problem:** Port 8080 already in use
**Solution:** Stop the application using that port or change the port in `application.properties`:
```properties
server.port=8081
```
Then update the frontend proxy in `frontend/package.json`.

### Frontend won't start

**Problem:** `EADDRINUSE: address already in use :::3000`
**Solution:** Kill the process using port 3000:
```bash
# Find the process
lsof -i :3000

# Kill it
kill -9 <PID>
```

**Problem:** API calls fail
**Solution:** 
1. Make sure backend is running on port 8080
2. Check the browser console for errors
3. Verify the proxy setting in `frontend/package.json`

### Can't connect to database

**Problem:** Access denied for user
**Solution:** 
1. Verify MySQL username and password
2. Grant privileges to the user:
```sql
GRANT ALL PRIVILEGES ON professional_network.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [TESTING.md](TESTING.md) for testing guidelines
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review [API_TESTING.md](API_TESTING.md) for API documentation

## Default Credentials

For testing, the application doesn't come with default credentials. You need to sign up to create your first account.

## Development Tips

1. **Hot Reload**
   - Frontend: Changes auto-reload
   - Backend: Restart required (or use Spring DevTools)

2. **API Testing**
   - Backend API: http://localhost:8080/api
   - Use Postman or curl for direct API testing

3. **Database Access**
   - Use MySQL Workbench or command line:
     ```bash
     mysql -u root -p professional_network
     ```

4. **Logs**
   - Backend logs: Check terminal where `mvn spring-boot:run` is running
   - Frontend logs: Check browser console (F12)

## Clean Restart

If you want to start fresh:

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE professional_network; CREATE DATABASE professional_network;"

# Clean backend
mvn clean

# Clean frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Getting Help

If you encounter issues:
1. Check the error messages in the terminal
2. Look at browser console (F12) for frontend errors
3. Review application logs
4. Check MySQL is running and accessible
5. Verify all prerequisites are installed

## Success Indicators

You'll know everything is working when:
- ✅ Backend starts without errors on port 8080
- ✅ Frontend opens in browser at http://localhost:3000
- ✅ You can sign up and login
- ✅ You can create and view posts
- ✅ All three tabs (All Posts, Professional, Help) work

Enjoy using Professional Network! 🎉
