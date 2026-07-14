package com.social.network.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class PostResponseJsonTest {

    @Test
    void testIsLikedFieldSerialization() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Register JavaTimeModule for LocalDateTime
        
        PostResponse response = new PostResponse();
        response.setId(1L);
        response.setContent("Test post");
        response.setIsHelpSection(false);
        response.setIsSolved(false);
        response.setShowInHome(true);
        response.setUserId(1L);
        response.setUsername("testuser");
        response.setUserProfession("Engineer");
        response.setCreatedAt(LocalDateTime.now());
        response.setLikeCount(5);
        response.setCommentCount(2);
        response.setLiked(true); // This should be serialized as "isLiked"
        
        // Serialize to JSON
        String json = mapper.writeValueAsString(response);
        
        // Verify that the JSON contains "isLiked" field
        assertTrue(json.contains("\"isLiked\":true"), 
            "JSON should contain isLiked field, but got: " + json);
        
        // Deserialize back to object
        PostResponse deserialized = mapper.readValue(json, PostResponse.class);
        
        // Verify the field is correctly deserialized
        assertTrue(deserialized.isLiked(), "isLiked should be true after deserialization");
    }
    
    @Test
    void testIsLikedFieldFalse() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        
        PostResponse response = new PostResponse();
        response.setId(1L);
        response.setContent("Test post");
        response.setLiked(false); // This should be serialized as "isLiked"
        
        // Serialize to JSON
        String json = mapper.writeValueAsString(response);
        
        // Verify that the JSON contains "isLiked" field set to false
        assertTrue(json.contains("\"isLiked\":false"), 
            "JSON should contain isLiked:false, but got: " + json);
    }
}
