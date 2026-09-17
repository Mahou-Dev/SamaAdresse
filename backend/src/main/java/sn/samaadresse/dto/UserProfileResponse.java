package sn.samaadresse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.Role;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private boolean enabled;
    private Instant createdAt;
}
