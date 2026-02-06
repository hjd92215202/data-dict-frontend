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
        clearable
        @keyup.enter="doSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="doSearch">搜索标准</el-button>
        </template>
      </el-input>

      <div class="result-list" v-loading="loading">
        <!-- 情况 A: 找到了结果 (无论是精准匹配还是语义推荐) -->
        <template v-if="results.length > 0">
          <div class="section-tag">
            <el-icon><CircleCheck /></el-icon> 匹配到以下相关标准：
          </div>
          
          <el-card v-for="item in results" :key="item.id" class="result-item" shadow="hover">
            <div class="item-content">
              <div class="info">
                <div class="cn-row">
                  <span class="cn-name">{{ item.field_cn_name }}</span>
                  <!-- 只有通过向量搜索出来的推荐结果才显示匹配度 -->
                  <el-tag v-if="item.score" size="small" type="warning" effect="light" class="score-tag">
                    推荐匹配 {{ (item.score * 100).toFixed(0) }}%
                  </el-tag>
                  <el-tag v-else size="small" type="success" effect="plain" class="score-tag">
                    精准匹配
                  </el-tag>
                </div>
                <div class="en-name">{{ item.field_en_name }}</div>
              </div>
              <div class="meta">
                <el-tag size="small" info>{{ item.data_type }}</el-tag>
              </div>
            </div>
          </el-card>

          <!-- 核心改进：即使有结果，也允许用户发起“这不是我想要的”申请 -->
          <div class="not-found-footer">
            <span>没找到想要的精准标准？</span>
            <el-button type="primary" link @click="requestNew">提交新增申请</el-button>
          </div>
        </template>

        <!-- 情况 B: 搜索过但完全没有任何结果 -->
        <el-empty v-else-if="hasSearched && results.length === 0" description="未找到相关标准定义">
          <template #default>
            <p class="empty-tip">该字段可能尚未录入标准库，您可以向管理员发起申请</p>
            <el-button type="primary" @click="requestNew">立即申请新增标准</el-button>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search, CircleCheck } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import { ElMessage } from 'element-plus';
import { logger } from '../utils/logger';

const queryText = ref('');
const loading = ref(false);
const results = ref<any[]>([]);
const hasSearched = ref(false);

const doSearch = async () => {
  const q = queryText.value.trim();
  if (!q) return;

  logger.info("SearchPortal", "执行标准查询", q);
  loading.value = true;
  results.value = [];

  try {
    const { data } = await dictionaryApi.searchField(q);
    results.value = data;
    hasSearched.value = true;
    logger.debug("SearchPortal", `查询结束，召回 ${data.length} 条结果`);
  } catch (e) {
    logger.error("SearchPortal", "搜索接口异常", e);
  } finally {
    loading.value = false;
  }
};

const requestNew = async () => {
  const q = queryText.value.trim();
  if (!q) {
    ElMessage.warning("请先在搜索框输入您想申请的字段名称");
    return;
  }

  try {
    logger.info("SearchPortal", "提交新增申请", q);
    await dictionaryApi.submitRequest(q);
    ElMessage({
      message: `申请已提交: 【${q}】，管理员处理后将通知您`,
      type: 'success',
      duration: 5000
    });
  } catch (e) {
    logger.error("SearchPortal", "提交申请失败", e);
  }
};
</script>

<style scoped>
.user-search-container {
  max-width: 800px;
  margin: 60px auto;
  padding: 0 20px;
}

.search-header {
  text-align: center;
  margin-bottom: 40px;
}

.search-header h1 {
  font-size: 28px;
  color: #303133;
}

.search-header p {
  color: #909399;
  margin-top: 10px;
}

.result-list {
  margin-top: 40px;
}

.result-item {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cn-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.cn-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.en-name {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #409eff;
  font-size: 15px;
  font-weight: 600;
}

.score-tag {
  font-weight: normal;
}

.section-tag {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.not-found-footer {
  margin-top: 30px;
  padding: 20px;
  text-align: center;
  border-top: 1px dashed #dcdfe6;
  color: #909399;
  font-size: 14px;
}

.empty-tip {
  color: #909399;
  margin-bottom: 20px;
}
</style>