package com.county.companion.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.county.companion.entity.UserEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<UserEntity> {
}
