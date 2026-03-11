package com.county.companion.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.county.companion.entity.OrderRecordEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper extends BaseMapper<OrderRecordEntity> {
}
