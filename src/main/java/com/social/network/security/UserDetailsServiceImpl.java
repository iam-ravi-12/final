package com.social.network.security;

import com.social.network.entity.User;
import com.social.network.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        if (user.getStatus() == com.social.network.entity.AccountStatus.BANNED) {
            throw new org.springframework.security.authentication.LockedException("Your account has been banned");
        }
        if (user.getStatus() == com.social.network.entity.AccountStatus.DELETED) {
            throw new org.springframework.security.authentication.DisabledException("Your account has been deleted");
        }

        return UserDetailsImpl.build(user);
    }
}
