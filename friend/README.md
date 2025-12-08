# Friend App

A modern, beautiful friend management application built with React.

## Features

- 🎨 Beautiful gradient UI with smooth animations
- 👥 View and manage followers and following
- 📬 Handle pending friend requests
- 📊 Real-time statistics dashboard
- 📱 Fully responsive design
- 🔐 Secure authentication with JWT

## Getting Started

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

### Dashboard
- View follower and following counts
- See pending friend requests
- Beautiful statistics cards with gradient design

### Tabs
1. **Following**: View all users you follow with option to unfollow
2. **Followers**: See who's following you
3. **Requests**: Accept or reject pending friend requests

### User Interface
- Modern gradient design with purple theme
- Smooth animations and transitions
- Responsive layout for mobile and desktop
- Empty states for better UX
- Loading indicators

## API Integration

The app connects to the backend API at `/api` with the following endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/follows/following/:userId` - Get following list
- `GET /api/follows/followers/:userId` - Get followers list
- `GET /api/follows/pending` - Get pending requests
- `GET /api/follows/stats/:userId` - Get follow statistics
- `POST /api/follows/accept/:followId` - Accept follow request
- `POST /api/follows/reject/:followId` - Reject follow request
- `DELETE /api/follows/unfollow/:userId` - Unfollow user

## Project Structure

```
friend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Login.css
│   │   ├── Friends.js
│   │   └── Friends.css
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── followService.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## Technologies Used

- React 18.2.0
- React Router DOM 6.11.2
- Axios for API calls
- CSS3 with gradients and animations
- Modern JavaScript (ES6+)

## License

MIT
