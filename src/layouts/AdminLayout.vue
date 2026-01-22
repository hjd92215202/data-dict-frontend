<template>
  <el-container class="admin-layout">
    <!-- 管理员专用侧边栏 -->
    <el-aside width="240px" class="aside-menu">
      <div class="logo-box">
        <el-icon class="logo-icon"><DataLine /></el-icon>
        <span class="logo-text">字典管理系统</span>
      </div>

      <el-menu
        :default-active="activePath"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/fields">
          <el-icon><DataAnalysis /></el-icon>
          <span>标准字段管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/roots">
          <el-icon><Collection /></el-icon>
          <span>标准词根库</span>
        </el-menu-item>
        
        <el-divider />
        
        <el-menu-item index="/">
          <el-icon><Back /></el-icon>
          <span>返回查询门户</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <span>管理员工作台 / {{ currentRouteTitle }}</span>
        </div>
      </el-header>

      <el-main>
        <!-- 路由出口：显示子页面内容 -->
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DataAnalysis, Collection, DataLine, Back } from '@element-plus/icons-vue';

const route = useRoute();
const activePath = computed(() => route.path);
const currentRouteTitle = computed(() => route.meta.title);
</script>

<style scoped>
.admin-layout { height: 100vh; }
.aside-menu { background-color: #304156; }
.logo-box { height: 60px; display: flex; align-items: center; justify-content: center; background: #2b2f3a; color: #fff; font-weight: bold; }
.admin-header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; padding: 0 20px; }
.el-menu-vertical { border-right: none; }
</style>