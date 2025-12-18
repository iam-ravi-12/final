package com.social.network.repository;

import com.social.network.entity.EmailOTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailOTPRepository extends JpaRepository<EmailOTP, Long> {
    
    Optional<EmailOTP> findByEmailAndOtpAndVerifiedFalseAndExpiresAtAfter(
        String email, 
        String otp, 
        LocalDateTime currentTime
    );
    
    Optional<EmailOTP> findFirstByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);
    
    void deleteByEmail(String email);
}
