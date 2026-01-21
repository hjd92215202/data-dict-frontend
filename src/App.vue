<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <el-menu 
        :default-active="activeMenu" 
        class="el-menu-vertical"
        @select="handleSelect"
      >
        <div class="logo">数据字典标准系统</div>
        <el-menu-item index="mapper">
          <el-icon><Monitor /></el-icon>
          <span>智能字段命名</span>
        </el-menu-item>
        <el-menu-item index="fields">
          <el-icon><DataAnalysis /></el-icon>
          <span>标准字段库</span>
        </el-menu-item>
        <el-menu-item index="roots">
          <el-icon><Collection /></el-icon>
          <span>词根库管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-main>
      <SmartMapper v-if="activeMenu === 'mapper'" />
      <WordRootList v-else-if="activeMenu === 'roots'" />
      <StandardFieldList v-else-if="activeMenu === 'fields'" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Monitor, Collection,DataAnalysis  } from '@element-plus/icons-vue';
import SmartMapper from './components/SmartMapper.vue';
import WordRootList from './views/WordRootList.vue';
import StandardFieldList from './views/StandardFieldList.vue';

const activeMenu = ref('mapper');

const handleSelect = (index: string) => {
  activeMenu.value = index;
};
</script>

<style>
body { margin: 0; }
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-weight: bold;
  color: #409eff;
  border-bottom: 1px solid #eee;
}
.layout-container { height: 100vh; }
.el-menu-vertical { height: 100%; border-right: none; background: #f8f9fa; }
</style>