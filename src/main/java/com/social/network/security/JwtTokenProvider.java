package com.social.network.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    /**
     * Provide jwt.secret in application.properties or application.yml.
     * It can be:
     *  - a BASE64 encoded key (recommended for HS512) OR
     *  - a plain-text secret (not recommended for production unless long enough).
     *
     * Example property (base64 key):
     * jwt.secret=BASE64_ENCODED_64_BYTE_KEY_HERE
     *
     * Example to generate a valid HS512 key programmatically:
     * String base64Key = Base64.getEncoder().encodeToString(Keys.secretKeyFor(SignatureAlgorithm.HS512).getEncoded());
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // default 1 day
    private long jwtExpirationMs;

    private Key getSigningKey() {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured. Set 'jwt.secret' in application properties.");
        }

        // Try decode as BASE64 first (recommended). If it fails, fall back to raw bytes.
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            // if decode yields a valid length, return a key
            if (keyBytes.length >= 16) { // minimal sanity check
                return Keys.hmacShaKeyFor(keyBytes);
            }
        } catch (IllegalArgumentException ex) {
            // not base64, fall through to try raw bytes
            logger.debug("JWT secret not base64 - will use raw UTF-8 bytes (ensure length is sufficient)", ex);
        }

        // Fallback: use UTF-8 bytes of the provided secret (less secure unless long)
        byte[] raw = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            // warn if short - HS256 can use shorter keys, HS512 needs >=64 bytes (512 bits)
            logger.warn("JWT secret appears short ({} bytes). For HS512 use a 64-byte key (base64-encoded).", raw.length);
        }
        return Keys.hmacShaKeyFor(raw);
    }

    public String generateToken(Authentication authentication) {
        // If your principal class name is different, adjust the cast or obtain username differently.
        String username = authentication.getName(); // simpler and less coupled
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.error("Unexpected error while validating JWT: {}", ex.getMessage(), ex);
        }
        return false;
    }
}
