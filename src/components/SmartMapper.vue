<template>
  <div class="mapper-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="icon-magic"><MagicStick /></el-icon>
            <span class="title">标准字段生产台 (管理员)</span>
          </div>
          <el-tag type="warning" effect="light">生产环境逻辑：无词根不入库</el-tag>
        </div>
      </template>

      <el-form label-position="top">
        <!-- 1. 输入待录入的中文名称 -->
        <el-form-item>
          <template #label>
            <div class="label-with-tip">
              <span>输入字段中文名称</span>
              <small>系统将基于词根库进行智能切词并匹配缩写</small>
            </div>
          </template>
          <el-input
            v-model="cnInput"
            placeholder="例如：收货人电话"
            size="large"
            @input="handleInput"
            clearable
          />
        </el-form-item>

        <!-- 2. 分词与匹配结果预览 -->
        <div v-if="cnInput" class="mapping-result-box">
          <div class="section-title">分词匹配预览：</div>
          <div class="suggestion-row">
            <el-input
              v-model="suggestedEn"
              readonly
              class="en-display-input"
              size="large"
            >
              <template #prefix>EN:</template>
            </el-input>
            
            <!-- 入库按钮：只有当没有任何缺失词根时才启用 -->
            <el-button 
              type="primary" 
              size="large"
              :disabled="hasMissingRoots || !suggestedEn" 
              @click="openAdoptDialog"
            >
              正式入库
            </el-button>
          </div>

          <!-- 3. 状态预警：缺失词根提醒 -->
          <div v-if="hasMissingRoots" class="error-alert">
            <el-alert 
              title="无法入库：检测到未标准化的词段" 
              type="error" 
              :closable="false" 
              show-icon
            >
              <template #default>
                <div class="missing-content">
                  <p>以下词语尚未录入“标准词根库”，请先补全词根后再生成标准字段：</p>
                  <div class="missing-tags">
                    <el-tag 
                      v-for="word in missingWords" 
                      :key="word" 
                      type="danger" 
                      effect="dark"
                      class="word-tag"
                    >
                      {{ word }}
                    </el-tag>
                  </div>
                  <div class="action-hint">
                    <el-button type="danger" link @click="goToRootManagement">
                      👉 前往词根管理补全
                    </el-button>
                  </div>
                </div>
              </template>
            </el-alert>
          </div>

          <div v-else-if="suggestedEn" class="success-alert">
            <el-alert 
              title="符合标准：所有词段均已找到对应词根" 
              type="success" 
              :closable="false" 
              show-icon
            />
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 弹窗：正式入库 -->
    <el-dialog v-model="dialogVisible" title="确认入库：标准字段定义" width="500px">
      <el-form :model="adoptForm" label-width="120px">
        <el-form-item label="标准中文名">
          <el-input v-model="adoptForm.field_cn_name" readonly />
        </el-form-item>
        <el-form-item label="标准英文名">
          <el-input v-model="adoptForm.field_en_name" readonly />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="adoptForm.data_type" style="width: 100%">
            <el-option label="VARCHAR(100)" value="VARCHAR(100)" />
            <el-option label="INT" value="INT" />
            <el-option label="BIGINT" value="BIGINT" />
            <el-option label="DECIMAL(18,2)" value="DECIMAL(18,2)" />
            <el-option label="TIMESTAMP" value="TIMESTAMP" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联词根链">
          <el-tag 
            v-for="id in matchedIds" 
            :key="id" 
            size="small" 
            style="margin-right: 5px"
          >
            RootID: {{ id }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFinalSubmit" :loading="submitting">
          确认入库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MagicStick } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import { ElMessage } from 'element-plus';

// --- 数据定义 ---
const cnInput = ref('');
const suggestedEn = ref('');
const missingWords = ref<string[]>([]);
const matchedIds = ref<number[]>([]);

const dialogVisible = ref(false);
const submitting = ref(false);

const adoptForm = ref({
  field_cn_name: '',
  field_en_name: '',
  data_type: 'VARCHAR(100)',
  composition_ids: [] as number[]
});

// --- 计算属性 ---
const hasMissingRoots = computed(() => missingWords.value.length > 0);

// --- 逻辑处理 ---
let timer: any = null;
const handleInput = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    if (!cnInput.value.trim()) {
      suggestedEn.value = '';
      missingWords.value = [];
      matchedIds.value = [];
      return;
    }

    try {
      // 请求后端：分词并匹配词根
      const { data } = await dictionaryApi.getSuggest(cnInput.value);
      suggestedEn.value = data.suggested_en;
      missingWords.value = data.missing_words;
      matchedIds.value = data.matched_ids;
    } catch (e) {
      console.error("智能建议请求失败");
    }
  }, 350);
};

// 打开入库确认窗
const openAdoptDialog = () => {
  adoptForm.value = {
    field_cn_name: cnInput.value,
    field_en_name: suggestedEn.value,
    data_type: 'VARCHAR(100)',
    composition_ids: matchedIds.value
  };
  dialogVisible.value = true;
};

// 正式提交入库
const handleFinalSubmit = async () => {
  submitting.value = true;
  try {
    await dictionaryApi.createField(adoptForm.value);
    ElMessage.success('标准字段已成功录入标准库！');
    dialogVisible.value = false;
    // 重置界面
    cnInput.value = '';
    suggestedEn.value = '';
    missingWords.value = [];
    matchedIds.value = [];
  } catch (error: any) {
    ElMessage.error('入库失败');
  } finally {
    submitting.value = false;
  }
};

const goToRootManagement = () => {
  ElMessage.info('请在侧边栏切换至 [词根库管理] 页面进行新增');
  // 如果使用了 vue-router，这里可以 router.push('/roots')
};
</script>

<style scoped>
.mapper-container {
  max-width: 800px;
  margin: 30px auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-magic {
  color: #409eff;
  font-size: 20px;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.label-with-tip {
  display: flex;
  flex-direction: column;
}

.label-with-tip small {
  color: #999;
  font-weight: normal;
}

.mapping-result-box {
  margin-top: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.section-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.suggestion-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.en-display-input :deep(.el-input__wrapper) {
  background-color: #f0f7ff;
  font-family: 'Consolas', monospace;
  font-weight: bold;
}

.error-alert {
  border: 1px solid #f8d7da;
}

.missing-content p {
  margin: 0 0 10px 0;
  font-size: 13px;
}

.missing-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.word-tag {
  font-weight: bold;
}

.action-hint {
  margin-top: 15px;
  border-top: 1px dashed #fab6b6;
  padding-top: 10px;
}

.success-alert {
  border: 1px solid #c3e6cb;
}
</style>