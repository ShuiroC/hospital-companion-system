package com.county.companion.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.county.companion.common.ApiResponse;
import com.county.companion.entity.UserEntity;
import com.county.companion.mapper.UserMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/companions")
public class AdminCompanionController {

    private static final int ROLE_COMPANION = 3;
    private static final int STATUS_DISABLED = 0;
    private static final int STATUS_ACTIVE = 1;
    private static final int STATUS_PENDING = 2;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final UserMapper userMapper;

    public AdminCompanionController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() {
        List<UserEntity> users = userMapper.selectList(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getRole, ROLE_COMPANION)
                .orderByDesc(UserEntity::getId));
        List<Map<String, Object>> data = users.stream().map(this::toView).toList();
        return ApiResponse.success(data);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id) {
        return ApiResponse.success(toView(getCompanionById(id)));
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        UserEntity companion = getCompanionById(id);
        if (companion.getStatus() != null && companion.getStatus() == STATUS_ACTIVE) {
            return ApiResponse.success("Already approved", null);
        }

        userMapper.update(null, new LambdaUpdateWrapper<UserEntity>()
                .eq(UserEntity::getId, id)
                .eq(UserEntity::getRole, ROLE_COMPANION)
                .set(UserEntity::getStatus, STATUS_ACTIVE));
        return ApiResponse.success("Approved", null);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        UserEntity companion = getCompanionById(id);
        if (companion.getStatus() != null && companion.getStatus() == STATUS_DISABLED) {
            return ApiResponse.success("Already rejected", null);
        }

        userMapper.update(null, new LambdaUpdateWrapper<UserEntity>()
                .eq(UserEntity::getId, id)
                .eq(UserEntity::getRole, ROLE_COMPANION)
                .set(UserEntity::getStatus, STATUS_DISABLED));
        return ApiResponse.success("Rejected", null);
    }

    private UserEntity getCompanionById(Long id) {
        UserEntity companion = userMapper.selectOne(new LambdaQueryWrapper<UserEntity>()
                .eq(UserEntity::getId, id)
                .eq(UserEntity::getRole, ROLE_COMPANION)
                .last("limit 1"));
        if (companion == null) {
            throw new IllegalArgumentException("Companion not found");
        }
        return companion;
    }

    private Map<String, Object> toView(UserEntity user) {
        Map<String, Object> view = new HashMap<>();
        view.put("id", user.getId());
        view.put("username", user.getUsername());
        view.put("age", user.getAge());
        view.put("education", user.getEducation());
        view.put("workYears", user.getWorkYears());
        view.put("phone", user.getPhone());
        view.put("status", user.getStatus());
        view.put("statusText", statusText(user.getStatus()));
        view.put("createTime", user.getCreateTime() == null ? "" : user.getCreateTime().format(TIME_FORMATTER));
        return view;
    }

    private String statusText(Integer status) {
        if (status == null) return "UNKNOWN";
        if (status == STATUS_ACTIVE) return "APPROVED";
        if (status == STATUS_DISABLED) return "REJECTED";
        if (status == STATUS_PENDING) return "PENDING";
        return "UNKNOWN";
    }
}
