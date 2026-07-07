import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      authService.getUserProfile().then(profile => {
        const user = authService.getCurrentUser();
        if (user) {
          const updated = {
            ...user,
            name: profile.name,
            profession: profile.profession,
            organization: profile.organization,
            location: profile.location,
            profilePicture: profile.profilePicture,
            profileCompleted: profile.profileCompleted,
          };
          localStorage.setItem('user', JSON.stringify(updated));
        }
      }).catch(err => {
        console.error('Failed to sync profile in PrivateRoute:', err);
      });
    }
  }, [isAuthenticated]);

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
