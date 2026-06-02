package com.social.network.config;

import com.social.network.security.JwtTokenProvider;
import com.social.network.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            String token = extractToken(bearerToken);

            if (!StringUtils.hasText(token) || !jwtTokenProvider.validateToken(token)) {
                throw new IllegalArgumentException("Invalid or missing WebSocket authentication token");
            }

            String username = jwtTokenProvider.getUsernameFromJWT(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            accessor.setUser(authentication);
        }

        return message;
    }

    private String extractToken(String bearerToken) {
        if (!StringUtils.hasText(bearerToken)) {
            return null;
        }
        if (bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }
}
