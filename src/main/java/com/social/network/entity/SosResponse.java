package com.social.network.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sos_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sos_alert_id", nullable = false)
    private SosAlert sosAlert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", nullable = false)
    private User responder;

    @Column(name = "response_type", nullable = false)
    private String responseType; // ON_WAY, CONTACTED_AUTHORITIES, REACHED, RESOLVED

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "points_awarded")
    private Integer pointsAwarded = 0;

    @Column(name = "confirmed_by_alert_owner")
    private Boolean confirmedByAlertOwner = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
