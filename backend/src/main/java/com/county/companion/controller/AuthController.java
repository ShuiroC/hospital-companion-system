package com.county.companion.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.county.companion.common.ApiResponse;
import com.county.companion.dto.LoginRequest;
import com.county.companion.dto.RegisterRequest;
import com.county.companion.dto.UpdatePhoneRequest;
import com.county.companion.dto.UpdateUsernameRequest;
import com.county.companion.entity.UserEntity;
import com.county.companion.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String FIXED_PASSWORD = "123123";
    private static final int ROLE_PATIENT = 1;
    private static final int ROLE_COMPANION = 3;
    private static final int STATUS_DISABLED = 0;
    private static final int STATUS_ACTIVE = 1;
    private static final int STATUS_PENDING = 2;
    private final UserMapper userMapper;

    public AuthController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return registerAsRole(request, ROLE_PATIENT);
    }

    @PostMapping("/register/patient")
    public ApiResponse<Map<String, Object>> registerPatient(@Valid @RequestBody RegisterRequest request) {
        return registerAsRole(request, ROLE_PATIENT);
    }

    @PostMapping("/register/companion")
    public ApiResponse<Map<String, Object>> registerCompanion(@Valid @RequestBody RegisterRequest request) {
        return registerAsRole(request, ROLE_COMPANION);
    }

    private ApiResponse<Map<String, Object>> registerAsRole(RegisterRequest request, int targetRole) {
        if (!FIXED_PASSWORD.equals(request.password())) {
            return ApiResponse.fail("Password must be 123123");
        }
        if (targetRole == ROLE_COMPANION) {
            String companionProfileError = validateCompanionProfile(request);
            if (companionProfileError != null) {
                return ApiResponse.fail(companionProfileError);
            }
        }

        UserEntity exist = findUserByPhoneRole(request.phone(), targetRole);
        if (exist != null) {
            return ApiResponse.fail("Phone already registered under this role");
        }

        UserEntity user = new UserEntity();
        user.setUsername(normalizeUsername(request.username(), request.phone(), targetRole));
        user.setPhone(request.phone());
        user.setPassword(FIXED_PASSWORD);
        user.setRole(targetRole);
        user.setStatus(targetRole == ROLE_COMPANION ? STATUS_PENDING : STATUS_ACTIVE);
        if (targetRole == ROLE_COMPANION) {
            user.setAge(request.age());
            user.setEducation(normalizeEducation(request.education()));
            user.setWorkYears(request.workYears());
        }
        user.setCreateTime(LocalDateTime.now());
        userMapper.insert(user);

        Map<String, Object> result = new HashMap<>();
        result.put("username", user.getUsername());
        result.put("phone", request.phone());
        result.put("password", FIXED_PASSWORD);
        result.put("role", toRoleName(targetRole));
        result.put("status", user.getStatus());
        result.put("age", user.getAge());
        result.put("education", user.getEducation());
        result.put("workYears", user.getWorkYears());
        return ApiResponse.success("Register success", result);
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Integer role = normalizeRole(request.role());
        if (role == null) {
            return ApiResponse.fail("Role must be 1 (patient) or 3 (companion)");
        }

        UserEntity user = findUserByPhoneRole(request.phone(), role);
        if (user == null) {
            return ApiResponse.fail("Phone not registered under this role");
        }
        if (user.getStatus() == null || user.getStatus() == STATUS_DISABLED) {
            return ApiResponse.fail("Account is disabled");
        }
        if (role == ROLE_COMPANION && user.getStatus() == STATUS_PENDING) {
            return ApiResponse.fail("Companion account pending approval");
        }
        if (!FIXED_PASSWORD.equals(request.password()) || !FIXED_PASSWORD.equals(user.getPassword())) {
            return ApiResponse.fail("Password must be 123123");
        }

        return ApiResponse.success(Map.of(
                "token", "mock-token-" + System.currentTimeMillis(),
                "username", normalizeUsername(user.getUsername(), user.getPhone(), role),
                "phone", request.phone(),
                "role", toRoleName(role)
        ));
    }

    @PutMapping("/profile/username")
    public ApiResponse<Map<String, Object>> updateUsername(@Valid @RequestBody UpdateUsernameRequest request) {
        Integer role = normalizeRole(request.role());
        if (role == null) {
            return ApiResponse.fail("Role must be 1 (patient) or 3 (companion)");
        }

        UserEntity user = findUserByPhoneRole(request.phone(), role);
        if (user == null) {
            return ApiResponse.fail("User not found");
        }
        if (user.getStatus() == null || user.getStatus() == STATUS_DISABLED) {
            return ApiResponse.fail("Account is disabled");
        }

        String username = normalizeUsername(request.username(), request.phone(), role);
        userMapper.update(null, new LambdaUpdateWrapper<UserEntity>()
                .eq(UserEntity::getId, user.getId())
                .set(UserEntity::getUsername, username));

        return ApiResponse.success("Username updated", Map.of(
                "username", username,
                "phone", request.phone(),
                "role", toRoleName(role)
        ));
    }

    @PutMapping("/profile/phone")
    public ApiResponse<Map<String, Object>> updatePhone(@Valid @RequestBody UpdatePhoneRequest request) {
        Integer role = normalizeRole(request.role());
        if (role == null) {
            return ApiResponse.fail("Role must be 1 (patient) or 3 (companion)");
        }

        UserEntity user = findUserByPhoneRole(request.phone(), role);
        if (user == null) {
            return ApiResponse.fail("User not found");
        }
        if (user.getStatus() == null || user.getStatus() == STATUS_DISABLED) {
            return ApiResponse.fail("Account is disabled");
        }

        String newPhone = request.newPhone().trim();
        if (!newPhone.equals(user.getPhone())) {
            UserEntity duplicate = findUserByPhoneRole(newPhone, role);
            if (duplicate != null) {
                return ApiResponse.fail("Phone already registered under this role");
            }
        }

        userMapper.update(null, new LambdaUpdateWrapper<UserEntity>()
                .eq(UserEntity::getId, user.getId())
                .set(UserEntity::getPhone, newPhone));

        return ApiResponse.success("Phone updated", Map.of(
                "username", normalizeUsername(user.getUsername(), newPhone, role),
                "phone", newPhone,
                "role", toRoleName(role)
        ));
    }

    private UserEntity findUserByPhoneRole(String phone, Integer role) {
        return userMapper.selectOne(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getPhone, phone)
                .eq(UserEntity::getRole, role)
                .last("limit 1"));
    }

    private Integer normalizeRole(Integer requestedRole) {
        if (requestedRole == null) {
            return ROLE_PATIENT;
        }
        if (requestedRole == ROLE_PATIENT || requestedRole == ROLE_COMPANION) {
            return requestedRole;
        }
        return null;
    }

    private String toRoleName(Integer role) {
        return role != null && role == ROLE_COMPANION ? "COMPANION" : "PATIENT";
    }

    private String normalizeUsername(String rawUsername, String phone, Integer role) {
        if (rawUsername != null && !rawUsername.isBlank()) {
            return rawUsername.trim();
        }
        String suffix = phone != null && phone.length() >= 4 ? phone.substring(phone.length() - 4) : "0000";
        return (role != null && role == ROLE_COMPANION ? "Companion-" : "Patient-") + suffix;
    }

    private String normalizeEducation(String rawEducation) {
        return rawEducation == null ? "" : rawEducation.trim();
    }

    private String validateCompanionProfile(RegisterRequest request) {
        if (request.username() == null || request.username().isBlank()) {
            return "Companion name is required";
        }
        if (request.age() == null || request.age() < 18 || request.age() > 80) {
            return "Companion age must be between 18 and 80";
        }

        String education = normalizeEducation(request.education());
        if (education.isEmpty()) {
            return "Companion education is required";
        }
        if (education.length() > 30) {
            return "Companion education max length is 30";
        }

        if (request.workYears() == null || request.workYears() < 0 || request.workYears() > 60) {
            return "Companion work years must be between 0 and 60";
        }
        if (request.workYears() > request.age() - 16) {
            return "Companion work years is not realistic for the given age";
        }
        return null;
    }
}
