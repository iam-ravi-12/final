package com.social.network.controller;

import com.social.network.dto.AdminDashboardStats;
import com.social.network.dto.AdminUserResponse;
import com.social.network.dto.BanRequest;
import com.social.network.dto.ReportResponse;
import com.social.network.entity.Role;
import com.social.network.entity.ReportStatus;
import com.social.network.security.UserDetailsImpl;
import com.social.network.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String profession,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getUsers(search, profession, role, pageable));
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<String> banUser(
            @PathVariable Long id,
            @Valid @RequestBody BanRequest banRequest,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.banUser(id, banRequest.getReason(), admin.getId());
        return ResponseEntity.ok("User has been banned successfully");
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<String> unbanUser(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.unbanUser(id, admin.getId());
        return ResponseEntity.ok("User has been unbanned successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.deleteUser(id, admin.getId());
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<String> forceDeletePost(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.forceDeletePost(id, admin.getId());
        return ResponseEntity.ok("Post deleted successfully by admin");
    }

    @DeleteMapping("/community/{id}")
    public ResponseEntity<String> deleteCommunity(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.deleteCommunity(id, admin.getId());
        return ResponseEntity.ok("Community and associated data deleted successfully");
    }

    @DeleteMapping("/community/post/{id}")
    public ResponseEntity<String> forceDeleteCommunityPost(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.deleteCommunityPost(id, admin.getId());
        return ResponseEntity.ok("Community post deleted successfully by admin");
    }

    @GetMapping("/reports")
    public ResponseEntity<Page<ReportResponse>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getReports(status, pageable));
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<String> resolveReport(
            @PathVariable Long id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.resolveReport(id, adminNotes, admin.getId());
        return ResponseEntity.ok("Report resolved successfully");
    }

    @PutMapping("/reports/{id}/dismiss")
    public ResponseEntity<String> dismissReport(
            @PathVariable Long id,
            @RequestParam(required = false) String adminNotes,
            Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();
        adminService.dismissReport(id, adminNotes, admin.getId());
        return ResponseEntity.ok("Report dismissed successfully");
    }
}

