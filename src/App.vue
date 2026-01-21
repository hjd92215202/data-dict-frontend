<template>
  <el-container class="layout-container">
    <!-- 左侧导航栏 -->
    <el-aside width="240px" class="aside-menu">
      <div class="logo-box">
        <el-icon class="logo-icon"><DataLine /></el-icon>
        <span class="logo-text">企业级数据字典</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        @select="handleSelect"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <!-- 第一部分：面向全员的用户端 -->
        <el-menu-item-group title="用户门户">
          <el-menu-item index="user-search">
            <el-icon><Search /></el-icon>
            <span>标准字典查询</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-divider class="menu-divider" />

        <!-- 第二部分：面向管理员的生产端 -->
        <el-menu-item-group title="管理工作台">
          <el-menu-item index="field-list">
            <el-icon><DataAnalysis /></el-icon>
            <span>标准字段管理</span>
          </el-menu-item>
          <el-menu-item index="root-list">
            <el-icon><Collection /></el-icon>
            <span>标准词根库</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container>
      <el-header class="main-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ menuTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag size="small" effect="plain" type="success">当前角色: 管理员</el-tag>
        </div>
      </el-header>

      <el-main class="main-content">
        <!-- 动态切换组件 -->
        <keep-alive>
          <component :is="currentComponent" />
        </keep-alive>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Search, 
  DataAnalysis, 
  Collection, 
  DataLine 
} from '@element-plus/icons-vue';

// 导入业务组件
import UserSearch from './views/UserSearch.vue';
import StandardFieldList from './views/StandardFieldList.vue';
import WordRootList from './views/WordRootList.vue';

// 菜单状态
const activeMenu = ref('user-search');

// 组件映射表
const componentMap: Record<string, any> = {
  'user-search': UserSearch,
  'field-list': StandardFieldList,
  'root-list': WordRootList
};

// 菜单标题映射
const titleMap: Record<string, string> = {
  'user-search': '标准字典查询',
  'field-list': '标准字段管理',
  'root-list': '标准词根库管理'
};

// 计算当前显示的组件
const currentComponent = computed(() => componentMap[activeMenu.value]);
const menuTitle = computed(() => titleMap[activeMenu.value]);

// 菜单切换事件
const handleSelect = (index: string) => {
  activeMenu.value = index;
};
</script>

<style>
/* 全局样式重置 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f0f2f5;
}

.layout-container {
  height: 100vh;
}

/* 侧边栏样式 */
.aside-menu {
  background-color: #304156;
  box-shadow: 2px 0 6px rgba(0,21,41,0.35);
  z-index: 10;
}

.el-menu-vertical {
  border-right: none;
}

.logo-box {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  color: #fff;
}

.logo-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #409EFF;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
}

.menu-divider {
  margin: 10px 0;
  border-color: #3d4d66;
}

/* 顶栏样式 */
.main-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

/* 内容区样式 */
.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}

/* Element Plus 覆盖样式 */
.el-menu-item-group__title {
  padding: 15px 0 5px 20px !important;
  color: #889aa4 !important;
  font-size: 12px;
  text-transform: uppercase;
}
</style>