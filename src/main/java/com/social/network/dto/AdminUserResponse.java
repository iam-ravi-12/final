package com.social.network.dto;

import com.social.network.entity.Role;
import com.social.network.entity.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String profession;
    private String profilePicture;
    private Role role;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
