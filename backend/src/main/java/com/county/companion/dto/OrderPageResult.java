package com.county.companion.dto;

import com.county.companion.entity.OrderEntity;

import java.util.List;

public record OrderPageResult(
        List<OrderEntity> list,
        int total,
        int page,
        int pageSize
) {
}