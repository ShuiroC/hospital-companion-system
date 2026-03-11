package com.county.companion.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.county.companion.common.ApiResponse;
import com.county.companion.entity.HospitalEntity;
import com.county.companion.mapper.HospitalMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalMapper hospitalMapper;

    public HospitalController(HospitalMapper hospitalMapper) {
        this.hospitalMapper = hospitalMapper;
    }

    @GetMapping
    public ApiResponse<List<HospitalEntity>> list() {
        List<HospitalEntity> hospitals = hospitalMapper.selectList(
                new LambdaQueryWrapper<HospitalEntity>().orderByAsc(HospitalEntity::getId)
        );
        return ApiResponse.success(hospitals);
    }
}
