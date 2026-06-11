package com.social.network.service;

import com.social.network.dto.AuthResponse;
import com.social.network.dto.LoginRequest;
import com.social.network.dto.ProfileRequest;
import com.social.network.dto.ProfileResponse;
import com.social.network.dto.SignupRequest;
import com.social.network.dto.SignupResponse;
import com.social.network.entity.User;
import com.social.network.repository.UserRepository;
import com.social.network.security.JwtTokenProvider;
import com.social.network.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final OTPService otpService;
    private final CloudinaryService cloudinaryService;

    public AuthService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      AuthenticationManager authenticationManager,
                      JwtTokenProvider jwtTokenProvider,
                      OTPService otpService,
                      CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
        this.cloudinaryService = cloudinaryService;
    }

    public SignupResponse signup(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setProfileCompleted(false);
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        // Send OTP for email verification
        otpService.generateAndSendOTP(savedUser.getEmail());

        return new SignupResponse(
                "Account created successfully. Please verify your email with the OTP sent.",
                savedUser.getEmail(),
                true
        );
    }

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getProfileCompleted(),
                user.getEmailVerified()
        );
    }

    public void sendOTP(String email) {
        // Always generate and send OTP if email exists, but don't reveal if it doesn't
        // This prevents user enumeration attacks
        if (userRepository.existsByEmail(email)) {
            otpService.generateAndSendOTP(email);
        }
        // Note: We silently ignore non-existent emails to prevent user enumeration
    }

    public AuthResponse verifyEmailOTP(String email, String otp) {
        if (!otpService.verifyOTP(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Update user's email verification status
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEmailVerified(true);
        userRepository.save(user);

        // Create authentication token manually since user has verified via OTP
        UserDetailsImpl userDetails = new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword()
        );
        
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        
        SecurityContextHolder.getContext().setAuthentication(auth);
        String jwt = jwtTokenProvider.generateToken(auth);

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getProfileCompleted(),
                user.getEmailVerified()
        );
    }

    public void updateProfile(String username, ProfileRequest profileRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setProfession(profileRequest.getProfession());
        user.setOrganization(profileRequest.getOrganization());
        user.setLocation(profileRequest.getLocation());
        
        if (profileRequest.getProfilePicture() != null && !profileRequest.getProfilePicture().isEmpty()) {
            // Delete old profile picture from Cloudinary if it exists
            if (user.getProfilePicture() != null && !user.getProfilePicture().isEmpty()) {
                cloudinaryService.deleteMedia(user.getProfilePicture());
            }
            
            // Upload new profile picture to Cloudinary
            String imageUrl = cloudinaryService.uploadImage(
                profileRequest.getProfilePicture(), 
                "profiles"
            );
            user.setProfilePicture(imageUrl);
        }
        
        user.setProfileCompleted(true);

        userRepository.save(user);
    }

    public ProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getProfession(),
                user.getOrganization(),
                user.getLocation(),
                user.getProfileCompleted(),
                user.getProfilePicture()
        );
    }

    public ProfileResponse getUserProfileById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getProfession(),
                user.getOrganization(),
                user.getLocation(),
                user.getProfileCompleted(),
                user.getProfilePicture()
        );
    }

    public void registerFcmToken(String username, String fcmToken) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFcmToken(fcmToken);
        userRepository.save(user);
    }
}
