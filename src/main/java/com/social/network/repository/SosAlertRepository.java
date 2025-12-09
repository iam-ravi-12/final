package com.social.network.repository;

import com.social.network.entity.SosAlert;
import com.social.network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {
    List<SosAlert> findByStatusOrderByCreatedAtDesc(String status);
    
    List<SosAlert> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
    
    List<SosAlert> findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(String status, LocalDateTime after);
    
    @Query("SELECT s FROM SosAlert s WHERE s.status = :status AND " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(s.latitude)) * " +
           "cos(radians(s.longitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(s.latitude)))) <= :radiusKm " +
           "ORDER BY s.createdAt DESC")
    List<SosAlert> findNearbyActiveAlerts(
        @Param("latitude") Double latitude, 
        @Param("longitude") Double longitude,
        @Param("radiusKm") Double radiusKm,
        @Param("status") String status
    );
}
