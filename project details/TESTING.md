# Testing Guide

This guide provides instructions for testing the Professional Network application.

## Prerequisites

Before testing, ensure you have:
- Java 17 or higher
- MySQL 8.0 or higher running
- Node.js 14 or higher
- Maven 3.6 or higher
- npm or yarn

## Setting Up MySQL

1. Install MySQL if not already installed
2. Start the MySQL service:
   ```bash
   # On Linux
   sudo systemctl start mysql
   
   # On macOS
   brew services start mysql
   
   # On Windows
   # Use MySQL Workbench or Services
   ```

3. Create the database:
   ```bash
   mysql -u root -p
   ```
   
   Then run:
   ```sql
   CREATE DATABASE professional_network;
   EXIT;
   ```

4. Update credentials in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   ```

## Testing the Backend

1. Navigate to the project root:
   ```bash
   cd /path/to/professional-network
   ```

2. Build the project:
   ```bash
   mvn clean install
   ```

3. Run tests:
   ```bash
   mvn test
   ```

4. Start the backend:
   ```bash
   mvn spring-boot:run
   ```

5. Verify the backend is running:
   ```bash
   curl http://localhost:8080/api/auth/signup
   ```
   
   You should see a response indicating the endpoint exists.

## Testing the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build the frontend:
   ```bash
   npm run build
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. The application should open automatically at `http://localhost:3000`

## End-to-End Testing

### Test Case 1: User Registration and Login

1. Open `http://localhost:3000` in your browser
2. Click "Sign up" link
3. Fill in the registration form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Sign Up"
5. You should be redirected to the profile setup page

### Test Case 2: Profile Setup

1. After registration, you should be on the profile setup page
2. Fill in your profile details:
   - Profession: Software Engineer
   - Organization: Tech Corp
3. Click "Complete Profile"
4. You should be redirected to the home page

### Test Case 3: View All Posts

1. On the home page, you should see three tabs
2. Click on "All Posts" tab (should be active by default)
3. If there are no posts, you should see "No posts yet"
4. The page should load without errors

### Test Case 4: Create a Post

1. Click the "+ Create Post" button
2. Enter some text in the post content field
3. Optionally check "Mark as Help Request"
4. Click "Post"
5. The post should appear in the feed
6. Verify the post shows your username and profession

### Test Case 5: View Professional Posts

1. Click on the "Professional" tab
2. You should see only posts from users with the same profession
3. Create another user with a different profession and verify they don't see your posts in their Professional tab

### Test Case 6: Help Section

1. Click on the "Help Section" tab
2. You should see only posts marked as help requests
3. Create a help post and verify it appears in this section

### Test Case 7: Logout

1. Click the "Logout" button in the header
2. You should be redirected to the login page
3. Verify you cannot access `/home` without logging in

## API Testing

You can also test the API directly using curl or Postman:

### 1. Signup

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Save the token from the response.

### 3. Update Profile

```bash
curl -X POST http://localhost:8080/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "profession": "Software Engineer",
    "organization": "Tech Corp"
  }'
```

### 4. Create Post

```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "My first post!",
    "isHelpSection": false
  }'
```

### 5. Get All Posts

```bash
curl http://localhost:8080/api/posts/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Get Professional Posts

```bash
curl http://localhost:8080/api/posts/profession \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get Help Posts

```bash
curl http://localhost:8080/api/posts/help \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Backend Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in application.properties
   - Ensure the database exists

2. **Port 8080 Already in Use**
   - Change the port in application.properties: `server.port=8081`
   - Update the frontend proxy configuration accordingly

3. **JWT Token Errors**
   - Ensure JWT_SECRET is set properly
   - Check token expiration time

### Frontend Issues

1. **API Connection Errors**
   - Verify backend is running on port 8080
   - Check browser console for CORS errors
   - Ensure proxy is configured in package.json

2. **Build Errors**
   - Delete node_modules and package-lock.json
   - Run `npm install` again
   - Clear npm cache: `npm cache clean --force`

3. **React Router Issues**
   - Clear browser cache
   - Try incognito mode
   - Check browser console for errors

## Performance Testing

You can use tools like Apache JMeter or Artillery to test the API performance:

```bash
# Install Artillery
npm install -g artillery

# Run a simple load test
artillery quick --count 10 --num 20 http://localhost:8080/api/posts/all
```

## Security Testing

1. **Test JWT Token Expiration**
   - Login and save the token
   - Wait for the token to expire (24 hours by default)
   - Try to access protected endpoints
   - Should receive 401 Unauthorized

2. **Test Unauthorized Access**
   - Try to access `/api/posts` without a token
   - Should receive 401 Unauthorized

3. **Test SQL Injection**
   - Try entering SQL commands in form fields
   - Application should sanitize inputs

## Browser Compatibility

Test the application on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Testing

1. Test keyboard navigation
2. Test screen reader compatibility
3. Check color contrast
4. Verify form labels and ARIA attributes

## Notes

- All tests should pass before deploying to production
- Monitor console logs for errors
- Check network tab for failed requests
- Verify database state after operations
