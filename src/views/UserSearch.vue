<template>
  <div class="user-nav">
  <el-button link @click="$router.push('/admin')">进入后台管理</el-button>
</div>
  <div class="user-search-container">
    <div class="search-header">
      <h1>数据标准字典查询</h1>
      <p>搜索已定义的标准字段，确保研发命名规范统一</p>
    </div>

    <div class="search-main">
      <el-input
        v-model="queryText"
        placeholder="输入中文字段名称 (如: 手机号, 客户名称)"
        size="large"
        clearable
        @keyup.enter="doSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="doSearch">搜索</el-button>
        </template>
      </el-input>

      <div class="result-list" v-loading="loading">
        <template v-if="results.length > 0">
          <el-card v-for="item in results" :key="item.id" class="result-item">
            <div class="item-content">
              <div class="info">
                <div class="cn-name">{{ item.field_cn_name }}</div>
                <div class="en-name">{{ item.field_en_name }}</div>
              </div>
              <div class="meta">
                <el-tag size="small">{{ item.data_type }}</el-tag>
                <div class="time">发布于 {{ new Date(item.created_at).toLocaleDateString() }}</div>
              </div>
            </div>
          </el-card>
        </template>

        <el-empty v-else-if="hasSearched" description="未找到标准定义">
          <p class="empty-tip">请联系管理员在后台新增此标准字段</p>
          <el-button type="primary" plain @click="requestNew">提交新增申请</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import { ElMessage } from 'element-plus';

const queryText = ref('');
const loading = ref(false);
const results = ref<any[]>([]);
const hasSearched = ref(false);

const doSearch = async () => {
  if (!queryText.value) return;
  loading.value = true;
  try {
    const { data } = await dictionaryApi.searchField(queryText.value);
    results.value = data;
    hasSearched.value = true;
  } finally {
    loading.value = false;
  }
};

const requestNew = () => {
  ElMessage.success(`已记录申请: ${queryText.value}，请联系管理员处理`);
};
</script>

<style scoped>
.user-search-container { max-width: 700px; margin: 60px auto; }
.search-header { text-align: center; margin-bottom: 40px; }
.result-list { margin-top: 30px; }
.result-item { margin-bottom: 15px; transition: transform 0.2s; }
.result-item:hover { transform: translateY(-2px); border-color: #409eff; }
.item-content { display: flex; justify-content: space-between; align-items: center; }
.cn-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
.en-name { font-family: 'Consolas', monospace; color: #409eff; font-weight: bold; }
.meta { text-align: right; }
.time { font-size: 12px; color: #999; margin-top: 8px; }
.user-nav { position: absolute; top: 20px; right: 20px; }
</style>