package com.social.network.service;

import com.social.network.entity.SosAlert;
import com.social.network.repository.SosAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SosAlertCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(SosAlertCleanupService.class);

    private final SosAlertRepository sosAlertRepository;

    public SosAlertCleanupService(SosAlertRepository sosAlertRepository) {
        this.sosAlertRepository = sosAlertRepository;
    }

    /**
     * Scheduled task that runs every hour to clean up old SOS alerts
     * based on their emergency type and creation time.
     * 
     * Alert retention periods by emergency type:
     * - IMMEDIATE_EMERGENCY: 24 hours
     * - WOMEN_SAFETY: 24 hours
     * - MEDICAL: 24 hours
     * - FIRE: 2 days (48 hours)
     * - ACCIDENT: 3 days (72 hours)
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour at minute 0
    @Transactional
    public void cleanupOldAlerts() {
        logger.info("Starting SOS alert cleanup task...");
        
        LocalDateTime now = LocalDateTime.now();
        int totalDeleted = 0;
        
        // Clean up IMMEDIATE_EMERGENCY alerts older than 24 hours
        totalDeleted += deleteAlertsByTypeAndAge("IMMEDIATE_EMERGENCY", now.minusHours(24));
        
        // Clean up WOMEN_SAFETY alerts older than 24 hours
        totalDeleted += deleteAlertsByTypeAndAge("WOMEN_SAFETY", now.minusHours(24));
        
        // Clean up MEDICAL alerts older than 24 hours
        totalDeleted += deleteAlertsByTypeAndAge("MEDICAL", now.minusHours(24));
        
        // Clean up FIRE alerts older than 2 days (48 hours)
        totalDeleted += deleteAlertsByTypeAndAge("FIRE", now.minusDays(2));
        
        // Clean up ACCIDENT alerts older than 3 days (72 hours)
        totalDeleted += deleteAlertsByTypeAndAge("ACCIDENT", now.minusDays(3));
        
        logger.info("SOS alert cleanup completed. Total alerts deleted: {}", totalDeleted);
    }

    /**
     * Delete alerts of a specific type that are older than the given threshold
     */
    private int deleteAlertsByTypeAndAge(String emergencyType, LocalDateTime threshold) {
        List<SosAlert> oldAlerts = sosAlertRepository.findByEmergencyTypeAndCreatedAtBefore(
            emergencyType, threshold);
        
        if (!oldAlerts.isEmpty()) {
            sosAlertRepository.deleteAll(oldAlerts);
            logger.info("Deleted {} {} alerts older than {}", 
                oldAlerts.size(), emergencyType, threshold);
            return oldAlerts.size();
        }
        
        return 0;
    }

    /**
     * Manual cleanup method that can be called directly
     * Useful for testing or triggering cleanup on-demand
     */
    @Transactional
    public int performManualCleanup() {
        logger.info("Manual SOS alert cleanup triggered");
        cleanupOldAlerts();
        return 0; // Return value is logged in cleanupOldAlerts
    }
}
