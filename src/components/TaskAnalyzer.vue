<template>
  <div class="analyzer-tags">
    <template v-if="segments.length > 0">
      <div v-for="(seg, index) in segments" :key="index" class="segment-wrapper">
        
        <!-- 情况 A: 匹配到词根 (绿色) -->
        <template v-if="seg.isMatched">
          <el-tooltip 
            placement="top" 
            effect="light" 
            :disabled="seg.allCandidates.length <= 1"
          >
            <!-- 悬浮展示所有候选词根 -->
            <template #content>
              <div class="candidate-tip-title">可选词根 (共 {{ seg.allCandidates.length }} 个):</div>
              <div v-for="c in seg.allCandidates" :key="c.id" class="candidate-tip-item">
                <el-tag size="small" type="info" class="mr-5">{{ c.en_abbr }}</el-tag>
                <span>{{ c.cn_name }}</span>
                <span v-if="c.en_full_name" class="full-name"> - {{ c.en_full_name }}</span>
              </div>
            </template>

            <!-- 主展示标签 -->
            <el-badge 
              :value="seg.allCandidates.length" 
              :hidden="seg.allCandidates.length <= 1"
              type="warning"
              is-dot
              class="badge-item"
            >
              <el-tag 
                type="success" 
                :effect="seg.allCandidates.length > 1 ? 'light' : 'plain'" 
                class="word-tag"
                :class="{ 'has-multiple': seg.allCandidates.length > 1 }"
              >
                {{ seg.primaryEn }} <span class="cn-hint">({{ seg.text }})</span>
              </el-tag>
            </el-badge>
          </el-tooltip>
        </template>

        <!-- 情况 B: 缺失词根 (红色) -->
        <el-tag v-else type="danger" effect="dark" class="word-tag">
          {{ seg.text }} (缺失)
        </el-tag>

      </div>
    </template>
    <div v-else-if="loading" class="loading-text">智能分析中...</div>
    <div v-else class="loading-text">分析无结果</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dictionaryApi } from '../api';
import { logger } from '../utils/logger';

const props = defineProps<{ cnName: string }>();
const segments = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await dictionaryApi.getSuggest(props.cnName);
    
    if (data.segments) {
      segments.value = data.segments.map((seg: any) => {
        const candidates = seg.candidates || [];
        const isMatched = candidates.length > 0;
        return {
          text: seg.word,
          isMatched: isMatched,
          primaryEn: isMatched ? candidates[0].en_abbr : '', // 默认显示第一个
          allCandidates: candidates // 保存所有候选，供 Tooltip 使用
        };
      });
      logger.debug("TaskAnalyzer", `分析完成: ${props.cnName}`, segments.value);
    }
  } catch (e) {
    logger.error("TaskAnalyzer", "分析失败", e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.analyzer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px; /* 增加间距防止 Badge 重叠 */
  align-items: center;
}

.segment-wrapper {
  display: inline-block;
  vertical-align: middle;
}

.word-tag {
  font-weight: bold;
  font-family: 'Consolas', monospace;
  transition: all 0.2s;
}

/* 如果有多个候选，给标签加一个虚线边框增加辨识度 */
.word-tag.has-multiple {
  border-style: dashed;
}

.cn-hint {
  font-size: 10px;
  opacity: 0.8;
  font-weight: normal;
}

/* 气泡样式 */
.candidate-tip-title {
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
  color: #606266;
}

.candidate-tip-item {
  margin-bottom: 4px;
  font-size: 13px;
}

.mr-5 {
  margin-right: 8px;
}

.full-name {
  color: #999;
  font-size: 11px;
}

.loading-text {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

/* 修正 Badge 位置 */
.badge-item :deep(.el-badge__content.is-fixed.is-dot) {
  right: 2px;
  top: 4px;
}
</style>