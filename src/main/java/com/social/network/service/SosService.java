package com.social.network.service;

import com.social.network.dto.LeaderboardResponse;
import com.social.network.dto.SosAlertRequest;
import com.social.network.dto.SosAlertResponse;
import com.social.network.dto.SosResponseRequest;
import com.social.network.dto.SosResponseResponse;
import com.social.network.entity.SosAlert;
import com.social.network.entity.SosResponse;
import com.social.network.entity.User;
import com.social.network.repository.SosAlertRepository;
import com.social.network.repository.SosResponseRepository;
import com.social.network.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class SosService {

    private final SosAlertRepository sosAlertRepository;
    private final SosResponseRepository sosResponseRepository;
    private final UserRepository userRepository;

    public SosService(SosAlertRepository sosAlertRepository,
                     SosResponseRepository sosResponseRepository,
                     UserRepository userRepository) {
        this.sosAlertRepository = sosAlertRepository;
        this.sosResponseRepository = sosResponseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SosAlertResponse createSosAlert(String username, SosAlertRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SosAlert alert = new SosAlert();
        alert.setUser(user);
        alert.setLatitude(request.getLatitude());
        alert.setLongitude(request.getLongitude());
        alert.setLocationAddress(request.getLocationAddress());
        alert.setEmergencyType(request.getEmergencyType());
        alert.setDescription(request.getDescription());
        alert.setStatus("ACTIVE");
        alert.setCancelledByUser(false);

        SosAlert savedAlert = sosAlertRepository.save(alert);
        return convertToResponse(savedAlert, null, user);
    }

    @Transactional
    public SosAlertResponse cancelSosAlert(String username, Long alertId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SosAlert alert = sosAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("SOS Alert not found"));

        if (!alert.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only cancel your own alerts");
        }

        if (!"ACTIVE".equals(alert.getStatus())) {
            throw new RuntimeException("Alert is not active");
        }

        alert.setStatus("CANCELLED");
        alert.setCancelledByUser(true);
        SosAlert savedAlert = sosAlertRepository.save(alert);
        
        return convertToResponse(savedAlert, null, user);
    }

    public List<SosAlertResponse> getActiveAlerts(String username, Double latitude, Double longitude, Double radiusKm) {
        User currentUser = username != null ? userRepository.findByUsername(username).orElse(null) : null;
        
        if (latitude != null && longitude != null && radiusKm != null) {
            List<SosAlert> alerts = sosAlertRepository.findNearbyActiveAlerts(latitude, longitude, radiusKm, "ACTIVE");
            return alerts.stream()
                    .filter(this::isAlertStillValid) // Filter out expired alerts
                    .map(alert -> {
                        Double distance = calculateDistance(latitude, longitude, alert.getLatitude(), alert.getLongitude());
                        return convertToResponse(alert, distance, currentUser);
                    })
                    .collect(Collectors.toList());
        } else {
            List<SosAlert> alerts = sosAlertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            return alerts.stream()
                    .filter(this::isAlertStillValid) // Filter out expired alerts
                    .map(alert -> convertToResponse(alert, null, currentUser))
                    .collect(Collectors.toList());
        }
    }
    
    /**
     * Check if an alert is still valid based on its type-specific retention period
     * - IMMEDIATE_EMERGENCY: 24 hours
     * - WOMEN_SAFETY: 24 hours
     * - MEDICAL: 24 hours
     * - FIRE: 2 days (48 hours)
     * - ACCIDENT: 3 days (72 hours)
     */
    private boolean isAlertStillValid(SosAlert alert) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime createdAt = alert.getCreatedAt();
        
        switch (alert.getEmergencyType()) {
            case "IMMEDIATE_EMERGENCY":
            case "WOMEN_SAFETY":
            case "MEDICAL":
                // Valid for 24 hours
                return createdAt.isAfter(now.minusHours(24));
            case "FIRE":
                // Valid for 2 days (48 hours)
                return createdAt.isAfter(now.minusDays(2));
            case "ACCIDENT":
                // Valid for 3 days (72 hours)
                return createdAt.isAfter(now.minusDays(3));
            default:
                // Default to 24 hours for unknown types
                return createdAt.isAfter(now.minusHours(24));
        }
    }

    public List<SosAlertResponse> getUserAlerts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SosAlert> alerts = sosAlertRepository.findByUserAndStatusOrderByCreatedAtDesc(user, "ACTIVE");
        return alerts.stream()
                .filter(this::isAlertStillValid) // Filter out expired alerts
                .map(alert -> convertToResponse(alert, null, user))
                .collect(Collectors.toList());
    }

    public SosAlertResponse getAlertById(Long alertId, Double userLatitude, Double userLongitude) {
        SosAlert alert = sosAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("SOS Alert not found"));

        Double distance = null;
        if (userLatitude != null && userLongitude != null) {
            distance = calculateDistance(userLatitude, userLongitude, alert.getLatitude(), alert.getLongitude());
        }

        return convertToResponse(alert, distance, null);
    }

    @Transactional
    public SosResponseResponse respondToAlert(String username, SosResponseRequest request) {
        User responder = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SosAlert alert = sosAlertRepository.findById(request.getSosAlertId())
                .orElseThrow(() -> new RuntimeException("SOS Alert not found"));

        if (!"ACTIVE".equals(alert.getStatus())) {
            throw new RuntimeException("Alert is not active");
        }

        // Prevent user from responding to their own alert
        if (alert.getUser().getId().equals(responder.getId())) {
            throw new RuntimeException("You cannot respond to your own SOS alert");
        }

        // Check if already responded
        if (sosResponseRepository.existsBySosAlertAndResponder(alert, responder)) {
            throw new RuntimeException("You have already responded to this alert");
        }

        SosResponse response = new SosResponse();
        response.setSosAlert(alert);
        response.setResponder(responder);
        response.setResponseType(request.getResponseType());
        response.setMessage(request.getMessage());
        response.setConfirmedByAlertOwner(false); // Initially not confirmed

        // Points will be awarded when confirmed by alert owner
        int points = calculatePoints(request.getResponseType());
        response.setPointsAwarded(points);

        SosResponse savedResponse = sosResponseRepository.save(response);

        // If response type is RESOLVED, mark alert as resolved
        if ("RESOLVED".equals(request.getResponseType())) {
            alert.setStatus("RESOLVED");
            alert.setResolvedAt(LocalDateTime.now());
            sosAlertRepository.save(alert);
        }

        return convertToResponseResponse(savedResponse);
    }

    @Transactional
    public SosResponseResponse confirmHelpReceived(String username, Long responseId) {
        User alertOwner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SosResponse response = sosResponseRepository.findById(responseId)
                .orElseThrow(() -> new RuntimeException("Response not found"));

        SosAlert alert = response.getSosAlert();

        // Only the alert owner can confirm
        if (!alert.getUser().getId().equals(alertOwner.getId())) {
            throw new RuntimeException("Only the alert owner can confirm help received");
        }

        // Check if already confirmed
        if (response.getConfirmedByAlertOwner()) {
            throw new RuntimeException("Help already confirmed for this response");
        }

        // Mark as confirmed
        response.setConfirmedByAlertOwner(true);
        sosResponseRepository.save(response);

        // Award points to the responder
        User responder = response.getResponder();
        int currentPoints = responder.getLeaderboardPoints() != null ? responder.getLeaderboardPoints() : 0;
        responder.setLeaderboardPoints(currentPoints + response.getPointsAwarded());
        userRepository.save(responder);

        return convertToResponseResponse(response);
    }

    public List<SosResponseResponse> getAlertResponses(Long alertId) {
        SosAlert alert = sosAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("SOS Alert not found"));

        List<SosResponse> responses = sosResponseRepository.findBySosAlertOrderByCreatedAtDesc(alert);
        return responses.stream()
                .map(this::convertToResponseResponse)
                .collect(Collectors.toList());
    }

    public List<SosResponseResponse> getUserResponses(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SosResponse> responses = sosResponseRepository.findByResponderOrderByCreatedAtDesc(user);
        return responses.stream()
                .map(this::convertToResponseResponse)
                .collect(Collectors.toList());
    }

    public List<LeaderboardResponse> getLeaderboard(Integer limit) {
        PageRequest pageRequest = PageRequest.of(0, limit != null ? limit : 50);
        List<User> topUsers = userRepository.findByOrderByLeaderboardPointsDesc(pageRequest);
        
        return IntStream.range(0, topUsers.size())
                .mapToObj(index -> {
                    User user = topUsers.get(index);
                    int rank = index + 1;
                    String badge = null;
                    
                    // Assign badges to top 3
                    if (rank == 1) {
                        badge = "GOLD";
                    } else if (rank == 2) {
                        badge = "SILVER";
                    } else if (rank == 3) {
                        badge = "BRONZE";
                    }
                    
                    return new LeaderboardResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getName(),
                            user.getProfession(),
                            user.getProfilePicture(),
                            user.getLeaderboardPoints() != null ? user.getLeaderboardPoints() : 0,
                            rank,
                            badge
                    );
                })
                .collect(Collectors.toList());
    }

    private SosAlertResponse convertToResponse(SosAlert alert, Double distance, User currentUser) {
        long responseCount = sosResponseRepository.countBySosAlert(alert);
        
        // Check if current user has responded and get their response details
        boolean hasCurrentUserResponded = false;
        String currentUserResponseType = null;
        String currentUserResponseMessage = null;
        boolean isCurrentUserAlertOwner = false;
        
        if (currentUser != null) {
            // Check if current user is the alert owner
            isCurrentUserAlertOwner = alert.getUser().getId().equals(currentUser.getId());
            
            // Check if current user has responded
            SosResponse userResponse = sosResponseRepository.findBySosAlertAndResponder(alert, currentUser);
            if (userResponse != null) {
                hasCurrentUserResponded = true;
                currentUserResponseType = userResponse.getResponseType();
                currentUserResponseMessage = userResponse.getMessage();
            }
        }
        
        // Generate Google Maps URL if location is available
        String googleMapsUrl = null;
        if (alert.getLatitude() != null && alert.getLongitude() != null) {
            googleMapsUrl = String.format("https://www.google.com/maps?q=%f,%f", 
                alert.getLatitude(), alert.getLongitude());
        }
        
        // Determine emergency contact number based on type
        String emergencyContactNumber = getEmergencyContactNumber(alert.getEmergencyType());
        
        return new SosAlertResponse(
                alert.getId(),
                alert.getUser().getId(),
                alert.getUser().getUsername(),
                alert.getUser().getProfession(),
                alert.getUser().getProfilePicture(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.getLocationAddress(),
                alert.getEmergencyType(),
                alert.getStatus(),
                alert.getDescription(),
                alert.getCancelledByUser(),
                alert.getCreatedAt(),
                alert.getResolvedAt(),
                (int) responseCount,
                distance,
                googleMapsUrl,
                emergencyContactNumber,
                hasCurrentUserResponded,
                currentUserResponseType,
                currentUserResponseMessage,
                isCurrentUserAlertOwner
        );
    }

    private String getEmergencyContactNumber(String emergencyType) {
        return switch (emergencyType) {
            case "WOMEN_SAFETY", "IMMEDIATE_EMERGENCY", "ACCIDENT" -> "12"; // Police
            case "FIRE" -> "13"; // Fire
            case "MEDICAL" -> "14"; // Medical
            default -> "12"; // Default to police
        };
    }

    private SosResponseResponse convertToResponseResponse(SosResponse response) {
        return new SosResponseResponse(
                response.getId(),
                response.getSosAlert().getId(),
                response.getResponder().getId(),
                response.getResponder().getUsername(),
                response.getResponder().getProfilePicture(),
                response.getResponseType(),
                response.getMessage(),
                response.getPointsAwarded(),
                response.getConfirmedByAlertOwner(),
                response.getCreatedAt()
        );
    }

    private int calculatePoints(String responseType) {
        return switch (responseType) {
            case "ON_WAY" -> 10;
            case "CONTACTED_AUTHORITIES" -> 15;
            case "REACHED" -> 25;
            case "RESOLVED" -> 50;
            default -> 5;
        };
    }

    private Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        // Haversine formula to calculate distance in kilometers
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Get count of unread SOS alerts for a user
     * Counts active alerts created after user's last check time
     */
    public long getUnreadSosAlertsCount(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        
        // If user not found, return 0 (shouldn't happen with authenticated requests)
        if (user == null) {
            return 0;
        }

        LocalDateTime lastCheckTime = user.getLastSosCheckAt();
        
        // If user has never checked, count all active alerts
        if (lastCheckTime == null) {
            List<SosAlert> allActiveAlerts = sosAlertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            return allActiveAlerts.stream()
                    .filter(this::isAlertStillValid)
                    .filter(alert -> !alert.getUser().getId().equals(user.getId())) // Exclude user's own alerts
                    .count();
        }
        
        // Count alerts created after last check time
        List<SosAlert> alerts = sosAlertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        return alerts.stream()
                .filter(this::isAlertStillValid)
                .filter(alert -> alert.getCreatedAt().isAfter(lastCheckTime))
                .filter(alert -> !alert.getUser().getId().equals(user.getId())) // Exclude user's own alerts
                .count();
    }

    /**
     * Mark SOS alerts as read by updating user's last check time
     */
    @Transactional
    public void markSosAlertsAsRead(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        
        // If user not found, silently return (shouldn't happen with authenticated requests)
        if (user == null) {
            return;
        }
        
        user.setLastSosCheckAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
