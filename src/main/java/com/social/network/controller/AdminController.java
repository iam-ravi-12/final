package com.social.network.controller;

import com.social.network.dto.AuthResponse;
import com.social.network.entity.*;
import com.social.network.repository.*;
import com.social.network.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final SosAlertRepository sosAlertRepository;
    private final SosResponseRepository sosResponseRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // Hardcoded admin credentials
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "adminfriend";

    public AdminController(UserRepository userRepository,
                          PostRepository postRepository,
                          CommunityRepository communityRepository,
                          CommunityMemberRepository communityMemberRepository,
                          SosAlertRepository sosAlertRepository,
                          SosResponseRepository sosResponseRepository,
                          JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.communityRepository = communityRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.sosAlertRepository = sosAlertRepository;
        this.sosResponseRepository = sosResponseRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (ADMIN_USERNAME.equals(username) && ADMIN_PASSWORD.equals(password)) {
            // Generate a simple token for admin
            String token = jwtTokenProvider.generateToken("admin");
            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setUsername("admin");
            response.setProfileCompleted(true);
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body("Invalid admin credentials");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> userList = users.stream().map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("email", user.getEmail());
                userMap.put("name", user.getName());
                userMap.put("profession", user.getProfession());
                userMap.put("organization", user.getOrganization());
                userMap.put("location", user.getLocation());
                userMap.put("profileCompleted", user.getProfileCompleted());
                userMap.put("leaderboardPoints", user.getLeaderboardPoints());
                userMap.put("createdAt", user.getCreatedAt());
                return userMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(userList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching users: " + e.getMessage());
        }
    }

    @GetMapping("/posts/count")
    public ResponseEntity<?> getPostsCount() {
        try {
            long count = postRepository.count();
            Map<String, Object> response = new HashMap<>();
            response.put("totalPosts", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching posts count: " + e.getMessage());
        }
    }

    @GetMapping("/communities")
    public ResponseEntity<?> getAllCommunities() {
        try {
            List<Community> communities = communityRepository.findAll();
            List<Map<String, Object>> communityList = communities.stream().map(community -> {
                Map<String, Object> communityMap = new HashMap<>();
                communityMap.put("id", community.getId());
                communityMap.put("name", community.getName());
                communityMap.put("description", community.getDescription());
                communityMap.put("isPrivate", community.getIsPrivate());
                communityMap.put("adminId", community.getAdmin().getId());
                communityMap.put("adminName", community.getAdmin().getName());
                communityMap.put("createdAt", community.getCreatedAt());
                
                // Get member count
                long memberCount = communityMemberRepository.countByCommunityId(community.getId());
                communityMap.put("memberCount", memberCount);
                
                return communityMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(communityList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching communities: " + e.getMessage());
        }
    }

    @GetMapping("/communities/{id}/members")
    public ResponseEntity<?> getCommunityMembers(@PathVariable Long id) {
        try {
            List<CommunityMember> members = communityMemberRepository.findByCommunityId(id);
            List<Map<String, Object>> memberList = members.stream().map(member -> {
                Map<String, Object> memberMap = new HashMap<>();
                User user = member.getUser();
                memberMap.put("userId", user.getId());
                memberMap.put("username", user.getUsername());
                memberMap.put("name", user.getName());
                memberMap.put("profession", user.getProfession());
                memberMap.put("joinedAt", member.getJoinedAt());
                return memberMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(memberList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching community members: " + e.getMessage());
        }
    }

    @GetMapping("/sos")
    public ResponseEntity<?> getAllSosRequests() {
        try {
            List<SosAlert> sosAlerts = sosAlertRepository.findAllByOrderByCreatedAtDesc();
            List<Map<String, Object>> sosList = sosAlerts.stream().map(sos -> {
                Map<String, Object> sosMap = new HashMap<>();
                sosMap.put("id", sos.getId());
                sosMap.put("userId", sos.getUser().getId());
                sosMap.put("userName", sos.getUser().getName());
                sosMap.put("userUsername", sos.getUser().getUsername());
                sosMap.put("latitude", sos.getLatitude());
                sosMap.put("longitude", sos.getLongitude());
                sosMap.put("locationAddress", sos.getLocationAddress());
                sosMap.put("emergencyType", sos.getEmergencyType());
                sosMap.put("status", sos.getStatus());
                sosMap.put("description", sos.getDescription());
                sosMap.put("cancelledByUser", sos.getCancelledByUser());
                sosMap.put("createdAt", sos.getCreatedAt());
                sosMap.put("resolvedAt", sos.getResolvedAt());
                
                // Get response count
                long responseCount = sosResponseRepository.countBySosAlertId(sos.getId());
                sosMap.put("responseCount", responseCount);
                
                return sosMap;
            }).collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalSosRequests", sosList.size());
            response.put("sosRequests", sosList);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching SOS requests: " + e.getMessage());
        }
    }

    @GetMapping("/sos/{id}/responses")
    public ResponseEntity<?> getSosResponses(@PathVariable Long id) {
        try {
            List<SosResponse> responses = sosResponseRepository.findBySosAlertIdOrderByCreatedAtAsc(id);
            List<Map<String, Object>> responseList = responses.stream().map(response -> {
                Map<String, Object> responseMap = new HashMap<>();
                User responder = response.getResponder();
                responseMap.put("id", response.getId());
                responseMap.put("responderId", responder.getId());
                responseMap.put("responderName", responder.getName());
                responseMap.put("responderUsername", responder.getUsername());
                responseMap.put("responseType", response.getResponseType());
                responseMap.put("message", response.getMessage());
                responseMap.put("pointsAwarded", response.getPointsAwarded());
                responseMap.put("confirmedByAlertOwner", response.getConfirmedByAlertOwner());
                responseMap.put("createdAt", response.getCreatedAt());
                return responseMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching SOS responses: " + e.getMessage());
        }
    }
}
