<template>
  <div class="task-container">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <span class="title">用户需求待办列表</span>
          <el-tag type="danger">{{ tasks.length }} 条待处理</el-tag>
        </div>
      </template>

      <el-table :data="tasks" border v-loading="loading">
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        
        <el-table-column label="申请字段名" prop="payload.field_cn_name" width="200" />

        <el-table-column label="智能分词分析 (自动匹配当前词根库)">
          <template #default="{ row }">
            <TaskAnalyzer :cn-name="row.payload.field_cn_name" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleDone(row.id)">标记处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dictionaryApi } from '../api';
import { ElMessage } from 'element-plus';
import TaskAnalyzer from '../components/TaskAnalyzer.vue'; // 提取的分析组件
import { useTaskStore } from '../store/task';

const taskStore = useTaskStore();
const tasks = ref<any[]>([]);
const loading = ref(false);

const fetchTasks = async () => {
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getTasks();
    tasks.value = data;
  } finally { loading.value = false; }
};

const handleDone = async (id: number) => {
  try {
    await dictionaryApi.completeTask(id);
    ElMessage.success("已标记为已处理");
    
    // 关键：处理完后，立即让左侧菜单更新数字
    await taskStore.refreshCount();
    await fetchTasks(); // 刷新当前列表
  } catch (e) {
    ElMessage.error("操作失败");
  }
};

onMounted(fetchTasks);
</script>