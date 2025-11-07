# Professional Network - Full Stack Application

A full-stack professional networking application with a Spring Boot backend, MySQL database, and React frontend.

## Features

- **User Authentication**: Signup and Login with JWT tokens
- **Profile Management**: Users can set their profession and organization
- **Post Management**: Create and view posts with three different sections:
  1. **All Posts Overview**: View all posts from all users
  2. **Professional Posts**: View posts from users in the same profession
  3. **Help Section**: Posts specifically marked for help or assistance
- **Messaging System**: Direct messaging between users
  1. **Click to Message**: Click on any user's profile picture to start a conversation
  2. **Conversation List**: View all conversations with unread message counts
  3. **Real-time Updates**: Messages update automatically using polling
  4. **Read Receipts**: Messages are marked as read when viewed
- **React Frontend**: Modern, responsive user interface
- **REST API**: Full-featured backend API

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.1.5
- Spring Security with JWT
- Spring Data JPA
- MySQL Database
- Maven

### Frontend
- React 19
- React Router DOM
- Axios
- Modern CSS with responsive design

## Prerequisites

- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher
- Node.js 14 or higher
- npm or yarn

## Database Setup

1. Install MySQL and create a database:
```sql
CREATE DATABASE professional_network;
```

2. Configure database credentials using environment variables (recommended for production):
```bash
export DATABASE_URL=jdbc:mysql://localhost:3306/professional_network?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
export DATABASE_USERNAME=your_mysql_username
export DATABASE_PASSWORD=your_mysql_password
export JWT_SECRET=your_secure_random_secret_key
export JWT_EXPIRATION=86400000
```

Or update `src/main/resources/application.properties` for local development (not recommended for production):
```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

**Note:** The default values in `application.properties` are provided for convenience in local development only. Always use environment variables in production to keep credentials secure.

## Running the Application

### Backend

1. Navigate to the project root directory
2. Run the Spring Boot application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (first time only):
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will open automatically at `http://localhost:3000`

### Running Both Together

For development, you need to run both the backend and frontend:
1. Start the backend in one terminal (from project root): `mvn spring-boot:run`
2. Start the frontend in another terminal (from frontend directory): `npm start`

The React app will automatically proxy API requests to the backend running on port 8080.

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

### Messaging Endpoints

For detailed messaging API documentation, see [MESSAGING_API.md](MESSAGING_API.md).

#### Send Message
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Hello! How are you?"
}
```

#### Get Conversations
```
GET /api/messages/conversations
Authorization: Bearer <token>
```

#### Get Messages with User
```
GET /api/messages/with/{userId}
Authorization: Bearer <token>
```

#### Mark Messages as Read
```
PUT /api/messages/read/{userId}
Authorization: Bearer <token>
```

## User Flow

### For Web Application (React Frontend)

1. **Signup/Login**: User creates an account or logs in through the web interface
2. **Profile Setup**: After login, user completes profile with profession and organization
3. **Home Page**: User sees the dashboard with three tabs:
   - **All Posts**: Browse all posts from all users
   - **Professional**: See posts from users with the same profession
   - **Help Section**: View and create help requests
4. **Create Post**: Click "Create Post" to share content or request help
5. **Messaging**: 
   - Click on any user's profile picture to start a conversation
   - Click "Messages" button in navbar to view all conversations
   - Send and receive messages in real-time
6. **Logout**: Click logout to end the session

### For Mobile/External Applications

1. **Signup/Login**: User creates an account or logs in via API
2. **Profile Setup**: Complete profile with profession and organization
3. **Home Page**: Display three sections using the respective API endpoints
4. **Create Post**: Post content through the API

## Project Structure

```
professional-network/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── package.json
├── src/                     # Spring Boot backend
│   ├── main/
│   │   ├── java/
│   │   │   └── com/social/network/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── dto/
│   │   │       ├── entity/
│   │   │       ├── repository/
│   │   │       ├── security/
│   │   │       └── service/
│   │   └── resources/
│   │       └── application.properties
│   └── test/
└── pom.xml

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

### Messages Table
- `id`: Primary key
- `sender_id`: Foreign key to users (sender)
- `receiver_id`: Foreign key to users (receiver)
- `content`: Message content
- `is_read`: Boolean flag indicating if message was read
- `created_at`: Timestamp

## Integration

### Web Application (React)

The React frontend is already integrated and configured to work with the backend. Simply run both applications as described in the "Running the Application" section.

### Mobile/External Applications (Android, iOS, etc.)

To integrate with a mobile app or other external application:

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