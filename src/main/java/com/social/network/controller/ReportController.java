package com.social.network.controller;

import com.social.network.dto.ReportRequest;
import com.social.network.dto.ReportResponse;
import com.social.network.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<?> submitReport(
            Authentication authentication,
            @Valid @RequestBody ReportRequest reportRequest) {
        try {
            String username = authentication.getName();
            ReportResponse response = reportService.submitReport(username, reportRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
