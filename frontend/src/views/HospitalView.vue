<template>
  <el-card>
    <template #header>医院管理</template>
    <el-table :data="rows" stripe>
      <el-table-column prop="name" label="医院名称" min-width="180" />
      <el-table-column prop="level" label="等级" min-width="120" />
      <el-table-column prop="address" label="地址" min-width="260" />
      <el-table-column prop="phone" label="联系电话" min-width="140" />
    </el-table>
  </el-card>
</template>

<script setup>
const rows = [
  { name: '县人民医院', level: '二甲', address: '中心大道1号', phone: '010-88886666' },
  { name: '城关镇卫生院', level: '基层', address: '健康路8号', phone: '010-66668888' }
]
</script>
