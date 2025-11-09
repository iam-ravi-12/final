//package com.social.network.repository;
//
//import com.social.network.entity.Message;
//import com.social.network.entity.User;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//
//@Repository
//public interface MessageRepository extends JpaRepository<Message, Long> {
//
//    // Get all messages between two users, ordered by creation time
//    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.createdAt ASC")
//    List<Message> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
//
//    // Get all messages for a user (sent or received)
//    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver WHERE m.sender = :user OR m.receiver = :user ORDER BY m.createdAt DESC")
//    List<Message> findAllMessagesForUser(@Param("user") User user);
//
//    // Count unread messages for a receiver from a specific sender
//    Long countBySenderAndReceiverAndIsRead(User sender, User receiver, Boolean isRead);
//
//    // Get all users that current user has had conversations with
//    @Query("SELECT DISTINCT CASE WHEN m.sender = :user THEN m.receiver ELSE m.sender END FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver WHERE m.sender = :user OR m.receiver = :user")
//    List<User> findConversationPartners(@Param("user") User user);
//}

package com.social.network.repository;

import com.social.network.entity.Message;
import com.social.network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Get all messages between two users, ordered by creation time
    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.createdAt ASC")
    List<Message> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    // Get all messages for a user (sent or received)
    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver WHERE m.sender = :user OR m.receiver = :user ORDER BY m.createdAt DESC")
    List<Message> findAllMessagesForUser(@Param("user") User user);

    // Count unread messages for a receiver from a specific sender
    Long countBySenderAndReceiverAndIsRead(User sender, User receiver, Boolean isRead);

    // Get all users that current user has had conversations with
    // FIXED: Removed JOIN FETCH since we're not selecting the Message entity
//    @Query("SELECT DISTINCT CASE WHEN m.sender = :user THEN m.receiver ELSE m.sender END FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    @Query("""
      SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END
      FROM Message m
      WHERE m.sender.id = :userId OR m.receiver.id = :userId
    """)
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);
}
