# Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            React Frontend (Port 3000)                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Components:                                              │  │
│  │  • Login / Signup Pages                                   │  │
│  │  • Profile Setup                                          │  │
│  │  • Home Dashboard (All/Professional/Help tabs)            │  │
│  │  • Post Card Component                                    │  │
│  │  • Create Post Component                                  │  │
│  │                                                            │  │
│  │  Services:                                                 │  │
│  │  • Auth Service (JWT token management)                    │  │
│  │  • Post Service (CRUD operations)                         │  │
│  │  • API Service (Axios interceptors)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ HTTP/REST                         │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      Spring Boot Backend (Port 8080)                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │           Security Layer                           │   │  │
│  │  │  • JWT Token Provider                              │   │  │
│  │  │  • Authentication Filter                           │   │  │
│  │  │  • CORS Configuration                              │   │  │
│  │  │  • BCrypt Password Encoder                         │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                         │                                  │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │           Controller Layer                         │   │  │
│  │  │  • AuthController (/api/auth/*)                    │   │  │
│  │  │    - POST /signup                                  │   │  │
│  │  │    - POST /login                                   │   │  │
│  │  │    - POST /profile                                 │   │  │
│  │  │                                                     │   │  │
│  │  │  • PostController (/api/posts/*)                   │   │  │
│  │  │    - POST /posts                                   │   │  │
│  │  │    - GET /posts/all                                │   │  │
│  │  │    - GET /posts/profession                         │   │  │
│  │  │    - GET /posts/help                               │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                         │                                  │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │           Service Layer                            │   │  │
│  │  │  • AuthService                                     │   │  │
│  │  │    - User registration                             │   │  │
│  │  │    - User authentication                           │   │  │
│  │  │    - Profile management                            │   │  │
│  │  │    - JWT token generation                          │   │  │
│  │  │                                                     │   │  │
│  │  │  • PostService                                     │   │  │
│  │  │    - Create posts                                  │   │  │
│  │  │    - Retrieve posts (all/profession/help)          │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                         │                                  │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │          Repository Layer                          │   │  │
│  │  │  • UserRepository (Spring Data JPA)                │   │  │
│  │  │  • PostRepository (Spring Data JPA)                │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                         │                                  │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │             Entity Layer                           │   │  │
│  │  │  • User (id, username, email, password,            │   │  │
│  │  │          profession, organization)                 │   │  │
│  │  │  • Post (id, content, isHelpSection,               │   │  │
│  │  │          user, userProfession)                     │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ JPA/Hibernate                     │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               MySQL Database                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Tables:                                                   │  │
│  │  • users                                                   │  │
│  │    - id (PK)                                               │  │
│  │    - username (UNIQUE)                                     │  │
│  │    - email (UNIQUE)                                        │  │
│  │    - password (encrypted)                                  │  │
│  │    - profession                                            │  │
│  │    - organization                                          │  │
│  │    - profile_completed                                     │  │
│  │    - created_at, updated_at                                │  │
│  │                                                            │  │
│  │  • posts                                                   │  │
│  │    - id (PK)                                               │  │
│  │    - content                                               │  │
│  │    - is_help_section                                       │  │
│  │    - user_id (FK → users)                                  │  │
│  │    - user_profession (cached)                              │  │
│  │    - created_at, updated_at                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Authentication Flow

```
1. User enters credentials
   └─> Frontend validates input
       └─> POST /api/auth/login with {username, password}
           └─> Backend AuthController receives request
               └─> AuthService authenticates user
                   └─> UserRepository queries database
                       └─> BCrypt verifies password
                           └─> JwtTokenProvider generates token
                               └─> Return {token, user info}
                                   └─> Frontend stores token in localStorage
                                       └─> Redirect to home/profile-setup
```

### Post Creation Flow

```
1. User writes post content
   └─> Frontend validates input
       └─> POST /api/posts with {content, isHelpSection} + JWT token
           └─> Backend validates JWT token
               └─> PostController receives request
                   └─> PostService creates post
                       └─> PostRepository saves to database
                           └─> Return post data
                               └─> Frontend refreshes post list
```

### Viewing Posts Flow

```
1. User clicks on tab (All/Professional/Help)
   └─> Frontend calls respective API endpoint
       └─> GET /api/posts/{endpoint} + JWT token
           └─> Backend validates JWT token
               └─> PostController receives request
                   └─> PostService queries based on filter
                       └─> PostRepository fetches from database
                           └─> Return list of posts
                               └─> Frontend displays posts
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Request Flow                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  1. CORS Filter                        │
        │     • Validates origin                 │
        │     • Adds CORS headers                │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  2. JWT Authentication Filter          │
        │     • Extracts JWT from header         │
        │     • Validates token signature        │
        │     • Checks token expiration          │
        │     • Loads user details               │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  3. Security Context                   │
        │     • Sets authentication              │
        │     • Stores user details              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  4. Controller Layer                   │
        │     • Accesses authenticated user      │
        │     • Processes business logic         │
        └───────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Technologies
- **React 19**: UI library
- **React Router DOM 7**: Client-side routing
- **Axios 1.13**: HTTP client with interceptors
- **CSS3**: Styling with gradients and animations

### Backend Technologies
- **Spring Boot 3.1.5**: Application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data persistence
- **Hibernate**: ORM
- **JWT (jjwt 0.11.5)**: Token-based authentication
- **BCrypt**: Password hashing
- **MySQL Connector**: Database driver

### Database
- **MySQL 8.0**: Relational database

## Deployment Architecture

### Development Environment
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React      │────▶│  Spring      │────▶│    MySQL     │
│   (3000)     │     │   Boot       │     │   (3306)     │
│              │     │   (8080)     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Production Environment (Recommended)
```
                   ┌──────────────┐
                   │   CloudFront │
                   │  (CDN + SSL) │
                   └──────┬───────┘
                          │
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│     S3       │                  │  Load        │
│  (Static)    │                  │  Balancer    │
└──────────────┘                  └──────┬───────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                          ▼                             ▼
                 ┌──────────────┐            ┌──────────────┐
                 │  EC2/ECS     │            │  EC2/ECS     │
                 │  (Backend)   │            │  (Backend)   │
                 └──────┬───────┘            └──────┬───────┘
                        │                           │
                        └───────────┬───────────────┘
                                    │
                                    ▼
                           ┌──────────────┐
                           │  RDS MySQL   │
                           │  (Primary)   │
                           └──────┬───────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │  RDS MySQL   │
                           │  (Replica)   │
                           └──────────────┘
```

## Scalability Considerations

1. **Horizontal Scaling**: Backend can be scaled by adding more instances behind a load balancer
2. **Database Scaling**: Read replicas for GET operations, master for writes
3. **Caching**: Redis can be added for session management and frequently accessed data
4. **CDN**: CloudFront for static assets and frontend distribution
5. **Connection Pooling**: HikariCP manages database connections efficiently

## Monitoring and Observability

```
┌─────────────────────────────────────────────────────────┐
│  Application Monitoring                                  │
├─────────────────────────────────────────────────────────┤
│  • Spring Boot Actuator (health, metrics)                │
│  • Application logs (SLF4J + Logback)                    │
│  • Custom metrics (user activity, post creation rate)    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Infrastructure Monitoring                               │
├─────────────────────────────────────────────────────────┤
│  • CloudWatch (AWS)                                      │
│  • Prometheus + Grafana                                  │
│  • Database metrics (connections, slow queries)          │
└─────────────────────────────────────────────────────────┘
```

## API Rate Limiting

To prevent abuse, implement rate limiting:
- Per user: 100 requests per minute
- Per IP: 1000 requests per hour
- Anonymous users: 10 requests per minute

This can be implemented using:
- Spring framework filters
- API Gateway throttling
- Redis-based rate limiting
