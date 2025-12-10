package com.social.network.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sos_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "location_address")
    private String locationAddress;

    @Column(name = "emergency_type", nullable = false)
    private String emergencyType; // IMMEDIATE_EMERGENCY, ACCIDENT, WOMEN_SAFETY, MEDICAL, FIRE

    @Column(name = "status", nullable = false)
    private String status; // ACTIVE, CANCELLED, RESOLVED, EXPIRED

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "cancelled_by_user")
    private Boolean cancelledByUser = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
