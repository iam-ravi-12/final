# Professional Network - Backend API

A Spring Boot REST API backend for a professional networking Android application with MySQL database.

## Features

- **User Authentication**: Signup and Login with JWT tokens
- **Profile Management**: Users can set their profession and organization
- **Post Management**: Create and view posts with three different sections:
  1. **All Posts Overview**: View all posts from all users
  2. **Professional Posts**: View posts from users in the same profession
  3. **Help Section**: Posts specifically marked for help or assistance

## Tech Stack

- Java 17
- Spring Boot 3.1.5
- Spring Security with JWT
- Spring Data JPA
- MySQL Database
- Maven

## Prerequisites

- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher

## Database Setup

1. Install MySQL and create a database:
```sql
CREATE DATABASE professional_network;
```

2. Update database credentials in `src/main/resources/application.properties`:
```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

## Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Authentication Endpoints

#### Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "profileCompleted": false
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

Response: Same as signup

#### Update Profile
```
POST /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "profession": "Software Engineer",
  "organization": "Tech Corp"
}
```

### Post Endpoints

#### Create Post
```
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is my first post!",
  "isHelpSection": false
}
```

#### Get All Posts (Overview Section)
```
GET /api/posts/all
Authorization: Bearer <token>
```

#### Get Posts by Profession (Professional Section)
```
GET /api/posts/profession
Authorization: Bearer <token>
```

Returns posts only from users with the same profession as the logged-in user.

#### Get Help Posts (Help Section)
```
GET /api/posts/help
Authorization: Bearer <token>
```

Returns posts where `isHelpSection` is true.

## User Flow

1. **Signup/Login**: User creates an account or logs in
2. **Profile Setup**: After login, user must complete profile with profession and organization
3. **Home Page**: User is redirected to home page with three sections:
   - **All Overview**: See all posts from all users
   - **Professional**: See posts from same profession
   - **Help**: See help-related posts
4. **Create Post**: User can create posts and mark them as help-related or general

## Security

- All endpoints except `/api/auth/signup` and `/api/auth/login` require JWT authentication
- Passwords are encrypted using BCrypt
- JWT tokens expire after 24 hours

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `password`: Encrypted password
- `profession`: User's profession
- `organization`: User's organization
- `profile_completed`: Boolean flag
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Posts Table
- `id`: Primary key
- `content`: Post content
- `is_help_section`: Boolean flag for help posts
- `user_id`: Foreign key to users
- `user_profession`: User's profession (cached)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Android Integration

To integrate with an Android app:

1. Use the JWT token from login/signup response
2. Include the token in Authorization header for all authenticated requests:
   ```
   Authorization: Bearer <token>
   ```
3. Handle the `profileCompleted` flag to redirect users to profile completion page
4. Implement three tabs/sections on the home page calling respective endpoints

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid input or business logic error
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

## Development

To build the project:
```bash
mvn clean install
```

To run tests:
```bash
mvn test
```

## License

This project is licensed under the MIT License.