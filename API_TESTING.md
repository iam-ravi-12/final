# API Testing Guide

This document provides sample requests for testing the API endpoints.

## Prerequisites

- Application should be running on `http://localhost:8080`
- MySQL database should be running with the `professional_network` database
- Use a REST client like Postman, curl, or any HTTP client

## Testing Flow

### 1. Signup (Create New User)

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_dev",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "alice_dev",
  "email": "alice@example.com",
  "profileCompleted": false
}
```

Save the `token` value for subsequent requests.

### 2. Login (Existing User)

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_dev",
    "password": "password123"
  }'
```

**Expected Response:** Same as signup response

### 3. Update Profile

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "profession": "Software Engineer",
    "organization": "Tech Corp"
  }'
```

**Expected Response:**
```
Profile updated successfully
```

### 4. Create a Post

**Request (General Post):**
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Hello! This is my first post on the professional network.",
    "isHelpSection": false
  }'
```

**Request (Help Post):**
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Looking for help with Spring Boot configuration.",
    "isHelpSection": true
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "content": "Hello! This is my first post on the professional network.",
  "isHelpSection": false,
  "username": "alice_dev",
  "userProfession": "Software Engineer",
  "createdAt": "2024-01-01T10:00:00"
}
```

### 5. Get All Posts (Overview Section)

**Request:**
```bash
curl -X GET http://localhost:8080/api/posts/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "content": "Hello! This is my first post...",
    "isHelpSection": false,
    "username": "alice_dev",
    "userProfession": "Software Engineer",
    "createdAt": "2024-01-01T10:00:00"
  },
  ...
]
```

### 6. Get Posts by Profession (Professional Section)

**Request:**
```bash
curl -X GET http://localhost:8080/api/posts/profession \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:** Returns only posts from users with the same profession as the logged-in user

### 7. Get Help Posts (Help Section)

**Request:**
```bash
curl -X GET http://localhost:8080/api/posts/help \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:** Returns only posts where `isHelpSection` is true

## Testing with Multiple Users

To test profession-based filtering:

1. Create User 1 (Software Engineer)
2. Create User 2 (Data Scientist)
3. Create User 3 (Software Engineer)
4. Have each user create posts
5. Login as User 1 and call `/api/posts/profession` - should see posts from User 1 and User 3 only
6. Call `/api/posts/all` - should see posts from all users

## Error Cases to Test

### 1. Duplicate Username
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_dev",
    "email": "different@example.com",
    "password": "password123"
  }'
```
Expected: Error message "Username is already taken"

### 2. Invalid Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_dev",
    "password": "wrongpassword"
  }'
```
Expected: 400 Bad Request

### 3. Post Without Profile
Create a new user and try to create a post without updating profile first.

Expected: Error message "Please complete your profile first"

### 4. Unauthorized Access
Try to access protected endpoints without Authorization header.

Expected: 401 Unauthorized

## Android Integration Notes

In your Android app:

1. **Store the JWT token** after signup/login (SharedPreferences recommended)
2. **Add Authorization header** to all API requests:
   ```java
   HttpURLConnection conn = (HttpURLConnection) url.openConnection();
   conn.setRequestProperty("Authorization", "Bearer " + token);
   ```
3. **Check profileCompleted flag** after login to redirect to profile page or home page
4. **Implement three tabs** on home page:
   - Tab 1: All Posts - calls `/api/posts/all`
   - Tab 2: My Profession - calls `/api/posts/profession`
   - Tab 3: Help - calls `/api/posts/help`

## Database Verification

You can verify the data in MySQL:

```sql
-- View all users
SELECT * FROM users;

-- View all posts
SELECT p.id, p.content, p.is_help_section, u.username, p.user_profession 
FROM posts p 
JOIN users u ON p.user_id = u.id;

-- View posts by profession
SELECT * FROM posts WHERE user_profession = 'Software Engineer';
```
