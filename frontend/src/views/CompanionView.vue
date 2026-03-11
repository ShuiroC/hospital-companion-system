<template>
  <el-card>
    <template #header>陪诊员管理</template>
    <el-table :data="rows" stripe>
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="phone" label="手机号" min-width="140" />
      <el-table-column prop="status" label="状态" min-width="120" />
      <el-table-column prop="todayOrders" label="今日订单" min-width="100" />
      <el-table-column prop="rating" label="评分" min-width="100" />
    </el-table>
  </el-card>
</template>

<script setup>
const rows = [
  { name: '李陪诊', phone: '13800001234', status: '在岗', todayOrders: 4, rating: 4.9 },
  { name: '王陪诊', phone: '13900005678', status: '休息', todayOrders: 0, rating: 4.7 }
]
</script>
