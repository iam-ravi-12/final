package com.social.network.repository;

import com.social.network.entity.SosAlert;
import com.social.network.entity.SosResponse;
import com.social.network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosResponseRepository extends JpaRepository<SosResponse, Long> {
    List<SosResponse> findBySosAlertOrderByCreatedAtDesc(SosAlert sosAlert);
    
    List<SosResponse> findByResponderOrderByCreatedAtDesc(User responder);
    
    long countBySosAlert(SosAlert sosAlert);
    
    boolean existsBySosAlertAndResponder(SosAlert sosAlert, User responder);
}
