<template>
  <el-container class="admin-layout">
    <!-- 左侧导航 -->
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
        <el-menu-item index="/admin/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户权限管理</span>
        </el-menu-item>
        
        <el-divider style="border-color: #3d4d66" />
        
        <el-menu-item index="/">
          <el-icon><Back /></el-icon>
          <span>返回查询门户</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRouteTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 退出登录区域 -->
        <div class="header-right">
          <el-dropdown @command="handleCommand" trigger="click">
            <span class="user-info">
              <span class="username">管理员</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item divided command="logout" class="logout-item">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  DataAnalysis, 
  Collection, 
  DataLine, 
  Back, 
  UserFilled, 
  ArrowDown, 
  SwitchButton 
} from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const activePath = computed(() => route.path);
const currentRouteTitle = computed(() => route.meta.title || '后台管理');

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout();
  }
};

// 退出登录逻辑
const handleLogout = () => {
  ElMessageBox.confirm(
    '确认退出系统管理后台吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 1. 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // 2. 提示并跳转
    ElMessage.success('已安全退出');
    router.push('/login');
  }).catch(() => {
    // 取消退出
  });
};
</script>

<style scoped>
.admin-layout { height: 100vh; }
.aside-menu { background-color: #304156; transition: width 0.3s; }
.logo-box { 
  height: 60px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #2b2f3a; 
  color: #fff; 
}
.logo-icon { font-size: 24px; color: #409EFF; margin-right: 10px; }
.logo-text { font-size: 16px; font-weight: bold; }

.el-menu-vertical { border-right: none; }

.admin-header { 
  background: #fff; 
  border-bottom: 1px solid #e6e6e6; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f6f6f6;
}

.avatar { background: #409eff; margin-right: 8px; }
.username { font-size: 14px; color: #606266; margin-right: 4px; }

.logout-item { color: #f56c6c; }

.admin-main {
  background-color: #f0f2f5;
  padding: 20px;
}

/* 简单的过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>