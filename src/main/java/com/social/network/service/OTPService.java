package com.social.network.service;

import com.social.network.entity.EmailOTP;
import com.social.network.repository.EmailOTPRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OTPService {

    private final EmailOTPRepository otpRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom;
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    public OTPService(EmailOTPRepository otpRepository, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
        this.secureRandom = new SecureRandom();
    }

    @Transactional
    public void generateAndSendOTP(String email) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        
        // Delete any existing unverified OTPs for this email
        otpRepository.deleteByEmail(email);
        
        // Create new OTP record
        EmailOTP emailOTP = new EmailOTP();
        emailOTP.setEmail(email);
        emailOTP.setOtp(otp);
        emailOTP.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        emailOTP.setVerified(false);
        
        otpRepository.save(emailOTP);
        
        // Send OTP via email
        emailService.sendOTPEmail(email, otp);
    }

    @Transactional
    public boolean verifyOTP(String email, String otp) {
        Optional<EmailOTP> otpRecord = otpRepository
            .findByEmailAndOtpAndVerifiedFalseAndExpiresAtAfter(
                email, 
                otp, 
                LocalDateTime.now()
            );
        
        if (otpRecord.isPresent()) {
            EmailOTP emailOTP = otpRecord.get();
            emailOTP.setVerified(true);
            otpRepository.save(emailOTP);
            return true;
        }
        
        return false;
    }

    public boolean isEmailVerified(String email) {
        Optional<EmailOTP> otpRecord = otpRepository
            .findFirstByEmailAndVerifiedFalseOrderByCreatedAtDesc(email);
        
        return otpRecord.isEmpty() || otpRecord.get().getVerified();
    }
}
