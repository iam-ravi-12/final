# Professional Network - React Frontend

This is the React frontend for the Professional Network application.

## Features

- **User Authentication**: Login and Signup with JWT tokens
- **Profile Setup**: Complete profile with profession and organization
- **Three Main Sections**:
  - **All Posts**: View all posts from all users
  - **Professional Posts**: View posts from users in the same profession
  - **Help Section**: View and create help-related posts
- **Create Posts**: Create new posts and mark them as help requests
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- Backend server running on `http://localhost:8080`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional - defaults to localhost:8080):
```
REACT_APP_API_URL=http://localhost:8080/api
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Production Build

Create an optimized production build:
```bash
npm run build
```

The build files will be in the `build/` directory.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   │   ├── CreatePost.js
│   │   ├── PostCard.js
│   │   └── PrivateRoute.js
│   ├── pages/           # Page components
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── ProfileSetup.js
│   │   └── Home.js
│   ├── services/        # API service layer
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── postService.js
│   ├── utils/           # Utility functions
│   │   └── dateUtils.js
│   ├── App.js           # Main app component with routing
│   └── index.js         # Entry point
└── package.json
```

## Environment Variables

- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8080/api`)

## Usage Flow

1. **Sign Up / Login**: Create an account or login with existing credentials
2. **Complete Profile**: After first login, complete your profile with profession and organization
3. **View Posts**: Browse posts in three sections:
   - All Posts: All posts from all users
   - Professional: Posts from users with the same profession
   - Help Section: Help-related posts
4. **Create Posts**: Click "Create Post" to share content or request help

## API Integration

The frontend communicates with the Spring Boot backend using Axios. The API service layer handles:
- JWT token management
- Request/response interceptors
- Error handling
- Automatic token refresh on 401 responses

## Styling

The application uses custom CSS with:
- Modern gradient design
- Responsive layout
- Smooth transitions and animations
- Mobile-friendly interface

## Available Scripts

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## License

This project is licensed under the MIT License.
