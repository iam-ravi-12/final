package com.social.network;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProfessionalNetworkApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProfessionalNetworkApplication.class, args);
    }
}
