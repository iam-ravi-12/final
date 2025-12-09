package com.social.network.controller;

import com.social.network.dto.LeaderboardResponse;
import com.social.network.dto.SosAlertRequest;
import com.social.network.dto.SosAlertResponse;
import com.social.network.dto.SosResponseRequest;
import com.social.network.dto.SosResponseResponse;
import com.social.network.service.SosService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SosController {

    private final SosService sosService;

    public SosController(SosService sosService) {
        this.sosService = sosService;
    }

    @PostMapping("/alert")
    public ResponseEntity<?> createSosAlert(
            Authentication authentication,
            @Valid @RequestBody SosAlertRequest request) {
        try {
            String username = authentication.getName();
            SosAlertResponse response = sosService.createSosAlert(username, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/alert/{alertId}/cancel")
    public ResponseEntity<?> cancelSosAlert(
            Authentication authentication,
            @PathVariable Long alertId) {
        try {
            String username = authentication.getName();
            SosAlertResponse response = sosService.cancelSosAlert(username, alertId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/alerts/active")
    public ResponseEntity<List<SosAlertResponse>> getActiveAlerts(
            Authentication authentication,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "50.0") Double radiusKm) {
        String username = authentication.getName();
        List<SosAlertResponse> alerts = sosService.getActiveAlerts(username, latitude, longitude, radiusKm);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/user")
    public ResponseEntity<List<SosAlertResponse>> getUserAlerts(Authentication authentication) {
        String username = authentication.getName();
        List<SosAlertResponse> alerts = sosService.getUserAlerts(username);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alert/{alertId}")
    public ResponseEntity<?> getAlertById(
            @PathVariable Long alertId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {
        try {
            SosAlertResponse response = sosService.getAlertById(alertId, latitude, longitude);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToAlert(
            Authentication authentication,
            @Valid @RequestBody SosResponseRequest request) {
        try {
            String username = authentication.getName();
            SosResponseResponse response = sosService.respondToAlert(username, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/alert/{alertId}/responses")
    public ResponseEntity<List<SosResponseResponse>> getAlertResponses(@PathVariable Long alertId) {
        try {
            List<SosResponseResponse> responses = sosService.getAlertResponses(alertId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(List.of());
        }
    }

    @GetMapping("/responses/user")
    public ResponseEntity<List<SosResponseResponse>> getUserResponses(Authentication authentication) {
        String username = authentication.getName();
        List<SosResponseResponse> responses = sosService.getUserResponses(username);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardResponse>> getLeaderboard(
            @RequestParam(required = false, defaultValue = "50") Integer limit) {
        List<LeaderboardResponse> leaderboard = sosService.getLeaderboard(limit);
        return ResponseEntity.ok(leaderboard);
    }

    @PutMapping("/response/{responseId}/confirm")
    public ResponseEntity<?> confirmHelpReceived(
            Authentication authentication,
            @PathVariable Long responseId) {
        try {
            String username = authentication.getName();
            SosResponseResponse response = sosService.confirmHelpReceived(username, responseId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
