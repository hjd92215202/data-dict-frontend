<template>
  <div class="user-search-container">
    <div class="search-header">
      <h1>数据标准查询门户</h1>
      <p>输入业务术语，获取研发标准命名</p>
    </div>

    <div class="search-main">
      <el-input
        v-model="queryText"
        placeholder="输入中文名称 (如: 支付金额)"
        size="large"
        @keyup.enter="doSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="doSearch">搜索</el-button>
        </template>
      </el-input>

      <div class="result-list" v-loading="loading">
        <!-- 1. 标准字段结果 (含语义匹配评分) -->
        <template v-if="results.length > 0">
          <div class="section-tag">找到以下标准定义：</div>
          <el-card v-for="item in results" :key="item.id" class="result-item">
            <div class="item-content">
              <div class="info">
                <div class="cn-row">
                  <span class="cn-name">{{ item.field_cn_name }}</span>
                  <el-tag v-if="item.score" size="small" type="warning" effect="plain" class="score-tag">
                    语义匹配 {{ (item.score * 100).toFixed(0) }}%
                  </el-tag>
                </div>
                <div class="en-name">{{ item.field_en_name }}</div>
              </div>
              <div class="meta">
                <el-tag size="small">{{ item.data_type }}</el-tag>
              </div>
            </div>
          </el-card>
        </template>

        <!-- 2. 词根级推荐 (当没有完整字段命中时) -->
        <div v-if="results.length === 0 && similarRoots.length > 0" class="recommend-box">
          <el-alert 
            title="未找到直接关联的标准字段，建议参考以下原子词根进行组合：" 
            type="info" 
            :closable="false" 
            show-icon 
          />
          <div class="similar-list">
            <el-card v-for="root in similarRoots" :key="root.id" class="root-mini-card" shadow="hover">
              <div class="flex-between">
                <span class="root-cn">{{ root.cn_name }}</span>
                <span class="root-en">{{ root.en_abbr }}</span>
              </div>
              <div class="root-full">{{ root.en_full_name || '-' }}</div>
            </el-card>
          </div>
        </div>

        <el-empty v-else-if="hasSearched && results.length === 0" description="暂无相关标准">
          <el-button type="primary" plain @click="requestNew">申请新增标准</el-button>
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

const similarRoots = ref<any[]>([]);

const doSearch = async () => {
  if (!queryText.value) return;
  loading.value = true;
  results.value = [];
  similarRoots.value = [];
  
  try {
    // A. 先查标准字段 (Postgres ILIKE)
    const { data: fieldData } = await dictionaryApi.searchField(queryText.value);
    results.value = fieldData;

    // B. 如果字段查不到，立即启动语义搜索词根 (Qdrant)
    if (fieldData.length === 0) {
      // 假设我们使用之前写的 search-similar-roots 接口
      const { data: simData } = await dictionaryApi.getSimilarRoots(queryText.value);
      similarRoots.value = simData;
    }
    
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
.section-tag { font-size: 12px; color: #909399; margin-bottom: 10px; }
.cn-row { display: flex; align-items: center; gap: 10px; }
.score-tag { font-size: 10px; }
.root-mini-card { margin-top: 10px; background: #fdfdfd; }
.root-cn { font-weight: bold; color: #409EFF; }
.root-en { font-family: monospace; color: #67C23A; }
.root-full { font-size: 12px; color: #999; margin-top: 5px; }
.flex-between { display: flex; justify-content: space-between; }
</style>