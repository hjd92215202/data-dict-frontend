<template>
  <el-container class="admin-layout">
    <!-- 左侧导航 -->
    <el-aside width="240px" class="aside-menu">
      <div class="logo-box">
        <el-icon class="logo-icon">
          <DataLine />
        </el-icon>
        <span class="logo-text">字典管理系统</span>
      </div>

      <el-menu :default-active="activePath" class="el-menu-vertical" background-color="#304156" text-color="#bfcbd9"
        active-text-color="#409EFF" router>
        
        <el-menu-item index="/admin/fields">
          <el-icon><DataAnalysis /></el-icon>
          <span>标准字段管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/roots">
          <el-icon><Collection /></el-icon>
          <span>标准词根库</span>
        </el-menu-item>

        <!-- 优化后的菜单项 -->
        <el-menu-item index="/admin/tasks" class="task-menu-item">
          <el-icon><Bell /></el-icon>
          <span class="menu-label">用户需求待办</span>
          <el-badge 
            v-if="taskStore.unprocessedCount > 0" 
            :value="taskStore.unprocessedCount" 
            :max="99"
            type="danger" 
            class="custom-badge"
          />
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户权限管理</span>
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
                  <el-icon>
                    <SwitchButton />
                  </el-icon>退出登录
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
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '../store/task';
import {
  DataAnalysis,
  Collection,
  DataLine,
  UserFilled,
  ArrowDown,
  SwitchButton,
  Bell
} from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();

const activePath = computed(() => route.path);
const currentRouteTitle = computed(() => route.meta.title || '后台管理');

const handleCommand = (command: string) => {
  if (command === 'logout') handleLogout();
};

const handleLogout = () => {
  ElMessageBox.confirm('确认退出系统管理后台吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    ElMessage.success('已安全退出');
    router.push('/login');
  }).catch(() => {});
};

onMounted(() => {
  taskStore.refreshCount();
  setInterval(() => {
    taskStore.refreshCount();
  }, 30000);
});
</script>

<style scoped>
.admin-layout { height: 100vh; }
.aside-menu { background-color: #304156; transition: width 0.3s; }
.logo-box { 
  height: 60px; display: flex; align-items: center; justify-content: center; 
  background: #2b2f3a; color: #fff; 
}
.logo-icon { font-size: 24px; color: #409EFF; margin-right: 10px; }
.logo-text { font-size: 16px; font-weight: bold; }
.el-menu-vertical { border-right: none; }
.admin-header { 
  background: #fff; border-bottom: 1px solid #e6e6e6; 
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 60px;
}
.user-info { display: flex; align-items: center; cursor: pointer; padding: 5px 8px; border-radius: 4px; }
.username { font-size: 14px; color: #606266; margin-right: 4px; }
.logout-item { color: #f56c6c; }
.admin-main { background-color: #f0f2f5; padding: 20px; }

/* 页面切换动画 */
.fade-transform-enter-active, .fade-transform-leave-active { transition: all 0.3s; }
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }

/* --- 菜单 Badge 深度优化样式 --- */

/* 强制让菜单项内容变为水平对齐 */
.task-menu-item :deep(.el-menu-item-content) {
  display: flex !important;
  align-items: center !important;
  width: 100%;
}

/* 撑开文字，让 Badge 靠右 */
.menu-label {
  flex: 1;
}

/* 核心对齐逻辑：取消 Badge 的绝对定位和偏移 */
.custom-badge {
  display: flex;
  align-items: center;
  margin-right: 15px; /* 距离右侧边缘的间距 */
}

/* 关键：重置 Element Plus 默认的右上角定位 */
.custom-badge :deep(.el-badge__content) {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  transform: none !important; /* 彻底取消 translate 偏移 */
  border: none; /* 去除白边 */
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  font-size: 12px;
  background-color: #f56c6c;
}
</style>