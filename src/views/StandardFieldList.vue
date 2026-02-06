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
      <el-form :model="form" label-width="110px" ref="formRef" :rules="rules">
        <el-form-item label="标准中文名" prop="field_cn_name">
          <el-input 
            v-model="form.field_cn_name" 
            placeholder="如：收货人手机号" 
            @input="handleAnalyze"
          />
        </el-form-item>

        <div class="analysis-box">
          <div class="box-title">词根组合校验结果：</div>
          
          <div v-if="missingWords.length > 0" class="status-error">
            <el-alert type="error" :closable="false">
              <template #title>
                无法生成：词项 [ {{ missingWords.join(', ') }} ] 未标准化
              </template>
              <div class="missing-actions">
                <p>请先在“词根管理”中录入以上词汇。</p>
                <div class="search-btns">
                  <el-button 
                    v-for="word in missingWords" 
                    :key="word"
                    size="small" 
                    type="primary" 
                    plain 
                    :icon="Search"
                    @click="searchSimilar(word)"
                  >
                    找词: {{ word }}
                  </el-button>
                </div>
              </div>
            </el-alert>
          </div>

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
          <el-input v-model="form.associated_terms" placeholder="用逗号隔开，用于用户模糊搜索" />
        </el-form-item>

        <el-form-item label="数据类型" prop="data_type">
          <el-select v-model="form.data_type" placeholder="选择字段数据类型" style="width: 100%">
            <el-option label="VARCHAR(50)" value="VARCHAR(50)" />
            <el-option label="VARCHAR(100)" value="VARCHAR(100)" />
            <el-option label="INT" value="INT" />
            <el-option label="DECIMAL(18,2)" value="DECIMAL(18,2)" />
            <el-option label="TIMESTAMP" value="TIMESTAMP" />
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

    <!-- 语义相似搜索弹窗 -->
    <el-dialog v-model="similarDialogVisible" :title="`针对【${searchingWord}】的推荐词根`" width="450px">
      <el-table :data="similarRoots" size="small" border>
        <el-table-column prop="cn_name" label="已有词根" />
        <el-table-column prop="en_abbr" label="缩写" />
        <el-table-column label="相似度" width="100">
          <template #default="{ row }">
            {{ (row.score * 100).toFixed(1) }}%
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 组成详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="标准字段组成解析" size="400px">
      <div v-if="selectedField" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="中文名称">{{ selectedField.field_cn_name }}</el-descriptions-item>
          <el-descriptions-item label="英文名称">{{ selectedField.field_en_name }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 25px">原子词根链</h4>
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
const loading = ref(false);
const submitting = ref(false);
const fields = ref<StandardField[]>([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const drawerVisible = ref(false);

const similarDialogVisible = ref(false);
const similarRoots = ref<any[]>([]);
const searchingWord = ref('');

const missingWords = ref<string[]>([]);
const matchedIds = ref<number[]>([]);

const selectedField = ref<StandardField | null>(null);
const detailRoots = ref<WordRoot[]>([]);

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

// 1. 获取列表
const fetchFields = async () => {
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getFields();
    fields.value = data; 
  } catch (e) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

// 2. 解析建议
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
      const { data } = await dictionaryApi.getSuggest(form.value.field_cn_name);
      form.value.field_en_name = data.suggested_en;
      missingWords.value = data.missing_words;
      matchedIds.value = data.matched_ids || []; 
    } catch (e) { console.error(e); }
  }, 400);
};

// 3. 语义搜索
const searchSimilar = async (word: string) => {
  searchingWord.value = word;
  try {
    const { data } = await dictionaryApi.getSimilarRoots(word);
    similarRoots.value = data;
    similarDialogVisible.value = true;
  } catch (e) { ElMessage.error("检索失败"); }
};

// 4. 保存
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        const payload = { ...form.value, composition_ids: matchedIds.value };
        if (form.value.id) {
          await dictionaryApi.updateField(form.value.id, payload);
        } else {
          await dictionaryApi.createField(payload);
        }
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        fetchFields();
      } catch (e) { ElMessage.error('保存失败'); } finally { submitting.value = false; }
    }
  });
};

// 5. 删除
const handleDelete = async (id: number) => {
  try {
    await dictionaryApi.deleteField(id);
    ElMessage.success('已删除');
    fetchFields();
  } catch (e) { ElMessage.error('删除失败'); }
};

// 6. 详情
const showDetail = async (row: StandardField) => {
  selectedField.value = row;
  detailRoots.value = [];
  drawerVisible.value = true;
  try {
    const { data } = await dictionaryApi.getFieldDetails(row.id!);
    detailRoots.value = data;
  } catch (e) { ElMessage.error("加载失败"); }
};

const openAddDialog = () => { resetForm(); dialogVisible.value = true; };
const handleEdit = (row: StandardField) => { 
  form.value = { ...row }; 
  handleAnalyze(); 
  dialogVisible.value = true; 
};
const resetForm = () => {
  form.value = { id: undefined, field_cn_name: '', field_en_name: '', associated_terms: '', data_type: 'VARCHAR(100)', composition_ids: [] };
  missingWords.value = [];
  matchedIds.value = [];
};

const filteredFields = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return fields.value;
  return fields.value.filter(f => f.field_cn_name.includes(q) || f.field_en_name.includes(q));
});

onMounted(fetchFields);
</script>

<style scoped>
.en-code { background: #f0f7ff; color: #409eff; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; }
.analysis-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed #dcdfe6; }
.box-title { font-size: 12px; color: #909399; margin-bottom: 10px; }
.missing-actions { margin-top: 8px; }
.search-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.field-container { padding: 10px; }
</style>