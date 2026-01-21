<template>
  <div class="field-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索标准名或同义词..."
          style="width: 320px"
          :prefix-icon="Search"
          clearable
        />
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          新增标准字段
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="filteredFields" border v-loading="loading" row-key="id" style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="field_cn_name" label="标准中文名" width="180" />
      <el-table-column prop="field_en_name" label="英文标准名" width="220">
        <template #default="{ row }">
          <code class="en-code">{{ row.field_en_name }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="associated_terms" label="同义词/关联词" show-overflow-tooltip />
      <el-table-column prop="data_type" label="数据类型" width="130" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="info" @click="showDetail(row)">组成详情</el-button>
          <el-popconfirm title="确定删除该标准字段吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '修改标准字段' : '新增标准字段'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="form"  label-width="110px" ref="formRef" :rules="rules">
        <el-form-item label="标准中文名" prop="field_cn_name">
          <el-input 
            v-model="form.field_cn_name" 
            placeholder="如：收货人手机号" 
            @input="handleAnalyze"
          />
        </el-form-item>

        <!-- 核心业务约束展示区 -->
        <div class="analysis-box">
          <div class="box-title">词根组合校验结果：</div>
          
          <!-- 情况A：存在缺失词根 -->
          <div v-if="missingWords.length > 0" class="status-error">
            <el-alert type="error" :closable="false" show-icon>
              <template #title>
                无法生成：词项 [ {{ missingWords.join(', ') }} ] 未标准化
              </template>
              <p>请先在“词根管理”中录入以上词汇，否则无法创建标准字段。</p>
            </el-alert>
          </div>

          <!-- 情况B：解析成功 -->
          <div v-else-if="form.field_en_name" class="status-success">
            <el-alert type="success" :closable="false" show-icon>
              <template #title>
                验证通过：生成的英文名为 <b>{{ form.field_en_name }}</b>
              </template>
              <div class="root-chain">
                关联词根ID链: 
                <el-tag v-for="id in matchedIds" :key="id" size="small" class="id-tag">
                  {{ id }}
                </el-tag>
              </div>
            </el-alert>
          </div>
          
          <div v-else class="status-empty">等待输入中文名进行解析...</div>
        </div>

        <el-form-item label="同义词" prop="associated_terms">
          <el-input 
            v-model="form.associated_terms" 
            placeholder="用逗号隔开，用于用户模糊搜索，如：手机,移动电话" 
          />
        </el-form-item>

        <el-form-item label="数据类型" prop="data_type">
          <el-select v-model="form.data_type" placeholder="选择字段数据类型" style="width: 100%">
            <el-option label="VARCHAR(50)" value="VARCHAR(50)" />
            <el-option label="VARCHAR(100)" value="VARCHAR(100)" />
            <el-option label="INT" value="INT" />
            <el-option label="BIGINT" value="BIGINT" />
            <el-option label="DECIMAL(18,2)" value="DECIMAL(18,2)" />
            <el-option label="TIMESTAMP" value="TIMESTAMP" />
            <el-option label="BOOLEAN" value="BOOLEAN" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitForm" 
          :loading="submitting"
          :disabled="missingWords.length > 0 || !form.field_en_name"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 组成详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="标准字段组成解析" size="400px">
      <div v-if="selectedField" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="中文名称">{{ selectedField.field_cn_name }}</el-descriptions-item>
          <el-descriptions-item label="英文名称">{{ selectedField.field_en_name }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 25px">原子词根链 (Composition)</h4>
        <el-timeline style="margin-top: 15px">
          <el-timeline-item
            v-for="root in detailRoots"
            :key="root.id"
            :timestamp="root.en_abbr"
            placement="top"
            type="primary"
          >
            <el-card shadow="never">
              <div style="font-weight: bold">{{ root.cn_name }}</div>
              <div style="font-size: 12px; color: #999; margin-top: 5px">
                ID: {{ root.id }} | {{ root.remark || '无备注' }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import type { StandardField, WordRoot } from '../types';
import { ElMessage } from 'element-plus';

const formRef = ref();
// --- 状态变量 ---
const loading = ref(false);
const submitting = ref(false);
const fields = ref<StandardField[]>([]);
const searchQuery = ref('');

const dialogVisible = ref(false);
const drawerVisible = ref(false);

const missingWords = ref<string[]>([]);
const matchedIds = ref<number[]>([]);

const form = ref<any>({
  id: undefined,
  field_cn_name: '',
  field_en_name: '',
  associated_terms: '',
  data_type: 'VARCHAR(100)',
  composition_ids: []
});

const rules = {
  field_cn_name: [{ required: true, message: '请输入中文全称', trigger: 'blur' }],
  data_type: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
};

const selectedField = ref<StandardField | null>(null);
const detailRoots = ref<WordRoot[]>([]);

// --- 核心逻辑 ---

// 获取字段列表
const fetchFields = async () => {
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getFields();
    // 确保直接覆盖了 fields.value
    fields.value = data; 
  } catch (e) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};



// 列表过滤逻辑
const filteredFields = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return fields.value;
  return fields.value.filter(f => 
    f.field_cn_name.toLowerCase().includes(q) || 
    f.field_en_name.toLowerCase().includes(q) ||
    (f.associated_terms && f.associated_terms.toLowerCase().includes(q))
  );
});

// 核心：处理解析建议 (管理员录入时的强校验)
let timer: any = null;
const handleAnalyze = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    if (!form.value.field_cn_name) {
      form.value.field_en_name = '';
      missingWords.value = [];
      matchedIds.value = [];
      return;
    }
    try {
      // 调用智能建议接口
      const { data } = await dictionaryApi.getSuggest(form.value.field_cn_name);
      form.value.field_en_name = data.suggested_en;
      missingWords.value = data.missing_words;
      // 注意：这里需要后端在接口中返回 matched_ids，以便存入 composition_ids
      matchedIds.value = (data as any).matched_ids || [];
    } catch (e) {
      console.error("解析失败");
    }
  }, 400);
};

// 保存字段
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        // 1. 必须 await 接口请求
        if (form.value.id) {
          await dictionaryApi.updateField(form.value.id, form.value);
        } else {
          await dictionaryApi.createField(form.value);
        }

        ElMessage.success('保存成功');
        
        // 2. 关闭弹窗
        dialogVisible.value = false;

        // 3. 核心：立即重新抓取最新数据
        // 注意：一定要 await fetchFields，确保列表更新完成
        await fetchFields(); 
        
      } catch (error: any) {
        ElMessage.error('保存失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 删除字段
const handleDelete = async (id: number) => {
  try {
    await dictionaryApi.deleteField(id);
    ElMessage.success('已删除');
    // 删除后必须重新获取列表
    await fetchFields(); 
  } catch (e) {
    ElMessage.error('删除失败');
  }
};

// 查看详情（组成解析）
const showDetail = async (row: StandardField) => {
  selectedField.value = row;
  drawerVisible.value = true;
  try {
    const { data } = await dictionaryApi.getFieldDetails(row.id!);
    detailRoots.value = data;
  } catch (e) {
    ElMessage.error('加载引用词根失败');
  }
};

// 弹窗控制
const openAddDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: StandardField) => {
  form.value = { ...row };
  // 编辑时也需要运行一遍解析逻辑以同步 ID 链和英文名状态
  handleAnalyze(); 
  dialogVisible.value = true;
};

const resetForm = () => {
  form.value = {
    id: undefined,
    field_cn_name: '',
    field_en_name: '',
    associated_terms: '',
    data_type: 'VARCHAR(100)',
    composition_ids: []
  };
  missingWords.value = [];
  matchedIds.value = [];
};

onMounted(fetchFields);
</script>

<style scoped>
.field-container {
  padding: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.en-code {
  background: #f0f7ff;
  color: #409eff;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-weight: bold;
}

.analysis-box {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 0 0 20px 110px;
  border: 1px dashed #dcdfe6;
}

.box-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.status-empty {
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
}

.root-chain {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.id-tag {
  margin: 0 2px;
}

.detail-content {
  padding: 0 10px;
}
</style>