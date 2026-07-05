package com.social.network.service;

import com.social.network.entity.EmailOTP;
import com.social.network.repository.EmailOTPRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OTPService {

    private final EmailOTPRepository otpRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

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
        log.info("Sending OTP email to {}", email);
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
}
