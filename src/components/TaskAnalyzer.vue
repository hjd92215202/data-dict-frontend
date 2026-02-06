<template>
  <div class="analyzer-tags">
    <template v-if="analysis">
      <el-tag 
        v-for="(word, index) in analysis.words" 
        :key="index"
        :type="word.isMatched ? 'success' : 'danger'"
        effect="light"
        class="word-tag"
      >
        <!-- 如果匹配成功，显示英文名；如果匹配失败，显示原词 -->
        {{ word.isMatched ? word.en : word.text }}
        <span v-if="!word.isMatched">(缺失)</span>
      </el-tag>
    </template>
    <div v-else class="loading-text">分析中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dictionaryApi } from '../api';
import { logger } from '../utils/logger';

const props = defineProps<{ cnName: string }>();
const analysis = ref<any>(null);

onMounted(async () => {
  try {
    const { data } = await dictionaryApi.getSuggest(props.cnName);
    
    // 修正点：去掉了未使用的 idx 参数
    const words = data.suggested_en.split('_').map((en: string) => {
      const isMatched = !en.includes('[');
      return {
        // 如果是 [词语] 格式，提取出中间的文本
        text: isMatched ? "" : en.replace('[', '').replace(']', ''),
        en: isMatched ? en : '',
        isMatched
      };
    });
    
    analysis.value = { words };
    logger.debug("TaskAnalyzer", `字段 [${props.cnName}] 自动分析完成`, words);
  } catch (e) {
    logger.error("TaskAnalyzer", "自动分析失败", e);
  }
});
</script>

<style scoped>
.analyzer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.word-tag {
  font-weight: bold;
}
.loading-text {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}
</style>