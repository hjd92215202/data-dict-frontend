<template>
  <div class="mapper-container">
    <!-- 主卡片：智能命名 -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">🚀 智能字段命名工具</span>
          <el-tag type="info">基于标准词根库</el-tag>
        </div>
      </template>

      <el-form label-position="top">
        <!-- 1. 输入区 -->
        <el-form-item label="中文名称 (输入后自动分词匹配)">
          <el-input
            v-model="cnInput"
            placeholder="例如：用户登录时间、订单支付金额"
            @input="handleInput"
            clearable
            size="large"
          >
            <template #prefix>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 2. 建议结果区 -->
        <el-form-item label="建议英文名 (Suggested English Name)">
          <div class="result-row">
            <el-input
              v-model="suggestedEn"
              readonly
              placeholder="等待输入..."
              size="large"
              class="en-input"
            >
              <template #suffix>
                <el-button link @click="copyToClipboard" v-if="suggestedEn">
                  复制
                </el-button>
              </template>
            </el-input>
            
            <el-button 
              type="success" 
              size="large"
              :disabled="!suggestedEn || missingWords.length > 0" 
              @click="prepareAdopt"
              class="adopt-btn"
            >
              采纳并入库
            </el-button>
          </div>
        </el-form-item>

        <!-- 3. 缺失词根提醒 -->
        <transition name="el-fade-in">
          <div v-if="missingWords.length > 0" class="warning-section">
            <el-alert title="词根缺失警告" type="warning" :closable="false" show-icon>
              <template #default>
                <p>以下词汇在标准库中未找到，请联系管理员：</p>
                <div class="tag-group">
                  <el-tag 
                    v-for="word in missingWords" 
                    :key="word" 
                    type="danger" 
                    effect="plain"
                    class="missing-tag"
                  >
                    {{ word }}
                  </el-tag>
                </div>
              </template>
            </el-alert>
          </div>
        </transition>
      </el-form>
    </el-card>

    <!-- 弹窗：确认入库详情 -->
    <el-dialog
      v-model="adoptDialogVisible"
      title="确认标准字段入库"
      width="500px"
      destroy-on-close
    >
      <el-form :model="adoptForm" label-width="100px" label-position="left">
        <el-form-item label="标准中文名">
          <el-input v-model="adoptForm.field_cn_name" readonly />
        </el-form-item>
        <el-form-item label="标准英文名">
          <el-input v-model="adoptForm.field_en_name" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="adoptForm.data_type" placeholder="选择字段类型" style="width: 100%">
            <el-option label="VARCHAR(50)" value="VARCHAR(50)" />
            <el-option label="VARCHAR(100)" value="VARCHAR(100)" />
            <el-option label="INT" value="INT" />
            <el-option label="BIGINT" value="BIGINT" />
            <el-option label="DECIMAL(18,2)" value="DECIMAL(18,2)" />
            <el-option label="TIMESTAMP" value="TIMESTAMP" />
            <el-option label="BOOLEAN" value="BOOLEAN" />
          </el-select>
        </el-form-item>
        <el-form-item label="引用词根ID">
          <el-tag v-for="id in adoptForm.composition_ids" :key="id" size="small" style="margin-right: 5px">
            {{ id }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adoptDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdopt" :loading="submitting">
            提交审核并入库
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import { ElMessage } from 'element-plus';

// 状态变量
const cnInput = ref('');
const suggestedEn = ref('');
const missingWords = ref<string[]>([]);
const matchedIds = ref<number[]>([]);

const adoptDialogVisible = ref(false);
const submitting = ref(false);

// 采纳表单数据
const adoptForm = ref({
  field_cn_name: '',
  field_en_name: '',
  data_type: 'VARCHAR(100)',
  composition_ids: [] as number[]
});

// 防抖计时器
let debounceTimer: any = null;

// 输入监听逻辑
const handleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    if (!cnInput.value.trim()) {
      suggestedEn.value = '';
      missingWords.value = [];
      matchedIds.value = [];
      return;
    }

    try {
      // 调用后端建议接口
      const { data } = await dictionaryApi.getSuggest(cnInput.value);
      suggestedEn.value = data.suggested_en;
      missingWords.value = data.missing_words;
      // 假设后端返回的数据结构中包含了 matched_ids
      matchedIds.value = (data as any).matched_ids || []; 
    } catch (error) {
      console.error('获取建议失败:', error);
    }
  }, 400); // 400ms 防抖
};

// 复制功能
const copyToClipboard = () => {
  navigator.clipboard.writeText(suggestedEn.value);
  ElMessage.success('英文名已复制');
};

// 打开采纳弹窗
const prepareAdopt = () => {
  adoptForm.value = {
    field_cn_name: cnInput.value,
    field_en_name: suggestedEn.value,
    data_type: 'VARCHAR(100)',
    composition_ids: [...matchedIds.value]
  };
  adoptDialogVisible.value = true;
};

// 提交到标准字段库
const submitAdopt = async () => {
  if (!adoptForm.value.field_en_name) {
    ElMessage.error('英文名不能为空');
    return;
  }

  submitting.value = true;
  try {
    await dictionaryApi.createField(adoptForm.value);
    ElMessage({
      message: '恭喜！标准字段已录入系统。',
      type: 'success',
    });
    adoptDialogVisible.value = false;
    // 成功后清空界面
    cnInput.value = '';
    suggestedEn.value = '';
    matchedIds.value = [];
  } catch (error: any) {
    ElMessage.error('入库失败: ' + (error.response?.data || '网络错误'));
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.mapper-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.result-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.en-input {
  flex: 1;
}

.en-input :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  color: #409eff;
}

.warning-section {
  margin-top: 25px;
}

.tag-group {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.missing-tag {
  font-weight: bold;
}

.adopt-btn {
  padding: 0 30px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>