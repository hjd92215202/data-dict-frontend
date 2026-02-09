<template>
  <div class="field-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input v-model="searchQuery" placeholder="搜索标准名或同义词..." style="width: 320px;" :prefix-icon="Search" clearable
          @input="handleSearch" />
      </div>
      <div class="right">
        <el-button type="success" :icon="Download" @click="handleExport" :disabled="fields.length === 0">
          导出备份
        </el-button>
        <el-button type="danger" plain :icon="Delete" @click="handleClearAll">
          清空所有
        </el-button>
        <el-divider direction="vertical" />
        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          新增标准字段
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="fields" border v-loading="loading" row-key="id" style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="field_cn_name" label="标准中文名" width="180" />
      <el-table-column prop="field_en_name" label="英文标准名" width="220">
        <template #default="{ row }">
          <code class="en-code">{{ row.field_en_name }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="associated_terms" label="同义词/关联词" show-overflow-tooltip />
      <el-table-column prop="data_type" label="数据类型" width="130" />
      <el-table-column prop="created_at" label="发布时间" width="180">
        <template #default="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
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

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '修改标准字段' : '新增标准字段'" width="850px" @closed="resetForm">
      <el-form :model="form" label-width="110px" ref="formRef" :rules="rules">
        <el-form-item label="标准中文名" prop="field_cn_name">
          <el-input v-model="form.field_cn_name" placeholder="如：客户支付状态" @input="handleAnalyze" clearable />
        </el-form-item>

        <div class="analysis-box">
          <div class="box-title">词根选择与校验矩阵：</div>

          <div v-if="analysisSegments.length > 0" class="segment-matrix">
            <div v-for="(seg, idx) in analysisSegments" :key="idx" class="matrix-column" 
                 :class="{ 'is-missing': seg.candidates.length === 0 }">
              <div class="seg-label">{{ seg.word }}</div>
              
              <div v-if="seg.candidates.length > 0" class="cand-list">
                <el-check-tag
                  v-for="cand in seg.candidates"
                  :key="cand.id"
                  :checked="selectedRootIds[idx] === cand.id"
                  @change="selectRoot(idx, cand)"
                  class="cand-item"
                >
                  <div class="cand-main">
                    {{ cand.en_abbr }} <span class="cand-cn">({{ cand.cn_name }})</span>
                  </div>
                  <div v-if="!cand.cn_name.includes(seg.word)" class="hit-reason">
                    命中: {{ cand.associated_terms }}
                  </div>
                </el-check-tag>
              </div>

              <div v-else class="missing-status">
                <div class="error-text">未找到词根</div>
                <el-button type="primary" link :icon="Search" @click="searchSimilar(seg.word)">找词</el-button>
              </div>
            </div>
          </div>
          <div v-else class="status-empty">等待输入中文名进行智能解析...</div>

          <div class="en-preview-bar" v-if="analysisSegments.length > 0">
            <div class="p-label">预测标准英文名：</div>
            <div class="p-value">
              <template v-for="(part, i) in previewParts" :key="i">
                <span :class="{ 'unselected': part === '??' }">{{ part }}</span>
                <i v-if="i < previewParts.length - 1">_</i>
              </template>
            </div>
          </div>
        </div>

        <el-form-item label="关联同义词" prop="associated_terms">
          <el-input v-model="form.associated_terms" placeholder="多个同义词用空格隔开，方便用户搜索" />
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
        <el-button type="primary" @click="submitForm" :loading="submitting"
          :disabled="!isSelectionComplete">
          确认正式入库
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
          <el-descriptions-item label="标准中文名">{{ selectedField.field_cn_name }}</el-descriptions-item>
          <el-descriptions-item label="标准英文名">{{ selectedField.field_en_name }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top: 25px">原子词根链</h4>
        <el-timeline style="margin-top: 15px">
          <el-timeline-item v-for="root in detailRoots" :key="root.id" :timestamp="root.en_abbr" placement="top" type="primary">
            <el-card shadow="never">
              <div style="font-weight: bold">{{ root.cn_name }}</div>
              <div style="font-size: 12px; color: #999; margin-top: 5px">ID: {{ root.id }} | {{ root.remark || '无备注' }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { Delete, Plus, Search, Download } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import type { StandardField, WordRoot, Segment } from '../types';
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus';
import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';

const formRef = ref();
const loading = ref(false);
const submitting = ref(false);
const fields = ref<StandardField[]>([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const drawerVisible = ref(false);

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const similarDialogVisible = ref(false);
const similarRoots = ref<any[]>([]);
const searchingWord = ref('');

const analysisSegments = ref<Segment[]>([]); 
const selectedRootIds = reactive<Record<number, number>>({}); 
const selectedRoots = reactive<Record<number, WordRoot>>({});    

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

const fetchFields = async () => {
  logger.info("Field:UI", "加载字段列表", { page: currentPage.value, q: searchQuery.value });
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getFields(currentPage.value, pageSize.value, searchQuery.value);
    fields.value = data.items;
    total.value = data.total;
  } finally { loading.value = false; }
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchFields();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchFields();
};

let searchTimer: any = null;
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchFields();
  }, 400);
};

let analyzeTimer: any = null;
const handleAnalyze = () => {
  if (analyzeTimer) clearTimeout(analyzeTimer);
  analyzeTimer = setTimeout(async () => {
    const input = form.value.field_cn_name?.trim();
    if (!input) {
      analysisSegments.value = [];
      return;
    }
    try {
      const { data } = await dictionaryApi.getSuggest(input);
      analysisSegments.value = data.segments;
      
      const existingIds = [...form.value.composition_ids];
      
      Object.keys(selectedRootIds).forEach(key => delete selectedRootIds[Number(key)]);
      Object.keys(selectedRoots).forEach(key => delete selectedRoots[Number(key)]);

      data.segments.forEach((seg, index) => {
        const savedId = existingIds[index];
        // 核心修复：增加 null/undefined 检查
        const savedMatch = seg.candidates.find(c => c.id === savedId);
        const firstCandidate = seg.candidates[0];

        if (savedMatch) {
            selectRoot(index, savedMatch);
        } else if (seg.candidates.length === 1 && firstCandidate) {
            selectRoot(index, firstCandidate);
        }
      });
    } catch (e) { logger.error("Analyzer", "解析请求失败", e); }
  }, 400);
};

const selectRoot = (index: number, root: WordRoot) => {
  if (root && root.id) {
    selectedRootIds[index] = root.id;
    selectedRoots[index] = root;
    syncToForm();
  }
};

const syncToForm = () => {
  form.value.field_en_name = previewParts.value.join('_');
  form.value.composition_ids = analysisSegments.value
    .map((_, i) => selectedRootIds[i])
    .filter(id => !!id);
};

const previewParts = computed(() => {
  return analysisSegments.value.map((_, i) => selectedRoots[i]?.en_abbr || '??');
});

const isSelectionComplete = computed(() => {
  if (analysisSegments.value.length === 0) return false;
  return analysisSegments.value.every((_, i) => !!selectedRootIds[i]);
});

const searchSimilar = async (word: string) => {
  searchingWord.value = word;
  try {
    const { data } = await dictionaryApi.getSimilarRoots(word);
    similarRoots.value = data;
    similarDialogVisible.value = true;
  } catch (e) { ElMessage.error("检索失败"); }
};

const handleExport = async () => {
  const loadingInstance = ElLoading.service({ text: '准备导出数据...' });
  try {
    const { data } = await dictionaryApi.getFields(1, 10000, searchQuery.value);
    const exportData = data.items.map((f, index) => ({
      "序号": index + 1,
      "标准中文名": f.field_cn_name,
      "标准英文名": f.field_en_name,
      "数据类型": f.data_type,
      "关联同义词": f.associated_terms || '-',
      "发布时间": f.created_at ? new Date(f.created_at).toLocaleString() : '-'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "数据标准清单");
    XLSX.writeFile(wb, `标准字段导出_${new Date().getTime()}.xlsx`);
  } finally { loadingInstance.close(); }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const isEdit = !!form.value.id;
      logger.info("Field:Action", isEdit ? "更新字段" : "创建字段", form.value);
      submitting.value = true;
      try {
        if (isEdit) {
          await dictionaryApi.updateField(form.value.id, form.value);
        } else {
          await dictionaryApi.createField(form.value);
        }
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        fetchFields();
      } finally { submitting.value = false; }
    }
  });
};

const handleDelete = async (id: number) => {
  try {
    await dictionaryApi.deleteField(id);
    ElMessage.success('已删除');
    fetchFields();
  } catch (e) {}
};

const showDetail = async (row: StandardField) => {
  selectedField.value = row;
  detailRoots.value = [];
  drawerVisible.value = true;
  try {
    const { data } = await dictionaryApi.getFieldDetails(row.id!);
    detailRoots.value = data;
  } catch (e) { ElMessage.error("详情加载失败"); }
};

const openAddDialog = () => { resetForm(); dialogVisible.value = true; };
const handleEdit = (row: StandardField) => {
  form.value = { ...row };
  handleAnalyze();
  dialogVisible.value = true;
};
const resetForm = () => {
  form.value = { id: undefined, field_cn_name: '', field_en_name: '', associated_terms: '', data_type: 'VARCHAR(100)', composition_ids: [] };
  analysisSegments.value = [];
  Object.keys(selectedRootIds).forEach(key => delete selectedRootIds[Number(key)]);
  Object.keys(selectedRoots).forEach(key => delete selectedRoots[Number(key)]);
};

const handleClearAll = () => {
  ElMessageBox.confirm('警告：此操作将永久清空标准库和向量索引！', '高危操作', { 
    confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'error' 
  }).then(async () => {
    const loadingInstance = ElLoading.service({ text: '清理中...' });
    try {
      const res = await dictionaryApi.clearAllFields();
      ElMessage.success(res.data);
      await fetchFields();
    } finally { loadingInstance.close(); }
  }).catch(() => {});
};

onMounted(fetchFields);
</script>

<style scoped>
.en-code { background: #f0f7ff; color: #409eff; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; }
.analysis-box { background: #f8f9fa; padding: 18px; border-radius: 8px; margin-bottom: 25px; border: 1px dashed #dcdfe6; }
.box-title { font-size: 13px; color: #606266; margin-bottom: 15px; font-weight: bold; }
.segment-matrix { display: flex; flex-wrap: wrap; gap: 15px; }
.matrix-column { background: #fff; border: 1px solid #e4e7ed; border-radius: 6px; padding: 12px; min-width: 160px; flex: 1; }
.matrix-column.is-missing { border-color: #f56c6c; background: #fff8f8; }
.seg-label { font-size: 12px; color: #909399; margin-bottom: 10px; text-align: center; border-bottom: 1px solid #f2f6fc; padding-bottom: 6px; font-weight: bold;}
.cand-list { display: flex; flex-direction: column; gap: 6px; }
.cand-item { width: 100%; text-align: left; cursor: pointer; height: auto; padding: 6px 10px; border: 1px solid #eee; }
.cand-main { font-weight: bold; font-size: 14px; }
.cand-cn { font-size: 11px; opacity: 0.6; font-weight: normal; }
.hit-reason { font-size: 10px; color: #999; margin-top: 4px; font-style: italic; }
.missing-status { text-align: center; padding: 10px 0; }
.error-text { font-size: 12px; color: #f56c6c; margin-bottom: 5px; }
.en-preview-bar { margin-top: 20px; padding: 15px; background: #f0f9eb; border-radius: 6px; display: flex; align-items: center; border: 1px solid #e1f3d8; }
.preview-label { font-size: 13px; color: #67c23a; margin-right: 12px; font-weight: bold;}
.preview-value { font-family: monospace; font-size: 18px; color: #303133; }
.unselected { color: #f56c6c; text-decoration: underline; }
.status-empty { color: #c0c4cc; text-align: center; font-size: 13px; padding: 20px 0;}
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.field-container { padding: 10px; }
.right .el-button { margin-left: 8px; }
</style>