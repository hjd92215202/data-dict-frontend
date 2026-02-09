<template>
  <div class="field-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input v-model="searchQuery" placeholder="搜索标准名或同义词..." style="width: 320px;" :prefix-icon="Search" clearable
          @input="handleSearchLog" />
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
    <el-table :data="filteredFields" border v-loading="loading" row-key="id" style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="field_cn_name" label="标准中文名" width="180" />
      <el-table-column prop="field_en_name" label="英文标准名" width="220">
        <template #default="{ row }">
          <code class="en-code">{{ row.field_en_name }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="associated_terms" label="同义词/关联词" show-overflow-tooltip />
      <el-table-column prop="data_type" label="数据类型" width="130" />
      <el-table-column prop="created_at" label="创建时间" width="160">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '修改标准字段' : '新增标准字段'" width="750px" @closed="resetForm">
      <el-form :model="form" label-width="110px" ref="formRef" :rules="rules">
        <el-form-item label="标准中文名" prop="field_cn_name">
          <el-input v-model="form.field_cn_name" placeholder="如：客户支付状态" @input="handleAnalyze" clearable />
        </el-form-item>

        <!-- 核心优化：交互式词根校验区 -->
        <div class="analysis-box">
          <div class="box-title">词根选择与校验矩阵：</div>

          <div v-if="analysisSegments.length > 0" class="segment-chain">
            <div v-for="(seg, idx) in analysisSegments" :key="idx" class="segment-item" 
                 :class="{ 'is-missing': seg.candidates.length === 0 }">
              <div class="original-word">{{ seg.word }}</div>
              
              <!-- 候选列表 -->
              <div v-if="seg.candidates.length > 0" class="candidate-list">
                <el-check-tag
                  v-for="cand in seg.candidates"
                  :key="cand.id"
                  :checked="selectedRootIds[idx] === cand.id"
                  @change="selectRoot(idx, cand)"
                  class="root-tag"
                >
                  {{ cand.en_abbr }}
                  <span class="cand-cn">({{ cand.cn_name }})</span>
                </el-check-tag>
              </div>

              <!-- 缺失状态 -->
              <div v-else class="missing-status">
                <el-tag type="danger" size="small">未建词根</el-tag>
                <el-button type="primary" link :icon="Search" @click="searchSimilar(seg.word)">找词</el-button>
              </div>
            </div>
          </div>

          <div v-else class="status-empty">等待输入中文名进行智能解析...</div>

          <!-- 生成预览 -->
          <div class="en-preview-bar" v-if="analysisSegments.length > 0">
            <div class="preview-label">实时生成英文名：</div>
            <div class="preview-value">
              <span v-for="(part, i) in previewParts" :key="i">
                <b :class="{ 'text-danger': part === '??' }">{{ part }}</b>
                <i v-if="i < previewParts.length - 1">_</i>
              </span>
            </div>
          </div>
        </div>

        <el-form-item label="同义词" prop="associated_terms">
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
          确认入库
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
          <el-timeline-item v-for="root in detailRoots" :key="root.id" :timestamp="root.en_abbr" placement="top"
            type="primary">
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
import { ref, onMounted, computed, reactive } from 'vue';
import { Delete, Plus, Search, Download } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import type { StandardField, WordRoot } from '../types';
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

const similarDialogVisible = ref(false);
const similarRoots = ref<any[]>([]);
const searchingWord = ref('');

// --- 交互选择核心状态 ---
const analysisSegments = ref<any[]>([]); // 存储分段和候选
const selectedRootIds = reactive<Record<number, number>>({}); // 索引 -> 已选词根ID
const selectedRoots = reactive<Record<number, any>>({});    // 索引 -> 词根对象详情

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
  logger.info("Field:UI", "请求加载标准字段列表数据");
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getFields();
    fields.value = data;
  } finally {
    loading.value = false;
  }
};

// 2. 交互式解析逻辑
let timer: any = null;
const handleAnalyze = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const input = form.value.field_cn_name?.trim();
    if (!input) {
      analysisSegments.value = [];
      return;
    }
    logger.info("Field:Service", "启动词根切分异步分析", { input });
    try {
      const { data } = await dictionaryApi.getSuggest(input);
      analysisSegments.value = data.segments;
      
      // 重置选择
      Object.keys(selectedRootIds).forEach(key => delete selectedRootIds[Number(key)]);
      Object.keys(selectedRoots).forEach(key => delete selectedRoots[Number(key)]);

      // 智能预选：如果段落只有一个候选词根，自动选中
      data.segments.forEach((seg: any, index: number) => {
        if (seg.candidates.length === 1) {
          selectRoot(index, seg.candidates[0]);
        }
      });
      logger.debug("Field:Data", "切分分析结果已更新", data.segments);
    } catch (e) { /* 处理已由拦截器记录 */ }
  }, 400);
};

// 选择操作
const selectRoot = (index: number, root: any) => {
  selectedRootIds[index] = root.id;
  selectedRoots[index] = root;
  syncToForm();
};

// 同步回 Form 原始数据
const syncToForm = () => {
  form.value.field_en_name = previewParts.value.join('_');
  form.value.composition_ids = analysisSegments.value
    .map((_, i) => selectedRootIds[i])
    .filter(id => !!id);
};

// 计算预览各部分
const previewParts = computed(() => {
  return analysisSegments.value.map((_, i) => selectedRoots[i]?.en_abbr || '??');
});

// 是否完成所有分段的选择
const isSelectionComplete = computed(() => {
  if (analysisSegments.value.length === 0) return false;
  return analysisSegments.value.every((_, i) => !!selectedRootIds[i]);
});

// 3. 语义搜索词根
const searchSimilar = async (word: string) => {
  logger.info("Field:Service", "触发语义找词请求", { word });
  searchingWord.value = word;
  try {
    const { data } = await dictionaryApi.getSimilarRoots(word);
    similarRoots.value = data;
    similarDialogVisible.value = true;
  } catch (e) {
    ElMessage.error("检索失败");
  }
};

// 4. Excel 导出逻辑
const handleExport = () => {
  logger.info("Field:Action", "触发导出 Excel 备份任务");
  try {
    const exportData = filteredFields.value.map((f, index) => ({
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
    ElMessage.success("导出成功");
  } catch (err) {
    logger.error("Field:Action", "导出组件异常", err);
  }
};

// 5. 保存
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const isEdit = !!form.value.id;
      logger.info("Field:Action", isEdit ? "提交字段更新" : "提交新增字段", form.value);
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

// 6. 删除
const handleDelete = async (id: number) => {
  logger.warn("Field:Action", `执行物理删除指令 ID: ${id}`);
  try {
    await dictionaryApi.deleteField(id);
    ElMessage.success('已删除');
    fetchFields();
  } catch (e) { }
};

// 7. 详情
const showDetail = async (row: StandardField) => {
  logger.debug("Field:UI", "打开详情抽屉", { id: row.id });
  selectedField.value = row;
  detailRoots.value = [];
  drawerVisible.value = true;
  try {
    const { data } = await dictionaryApi.getFieldDetails(row.id!);
    detailRoots.value = data;
  } catch (e) {
    ElMessage.error("详情加载失败");
  }
};

const handleSearchLog = () => {
  if (searchQuery.value) logger.debug("Field:UI", "执行本地搜索", { query: searchQuery.value });
};

const openAddDialog = () => { 
  resetForm(); 
  dialogVisible.value = true; 
};

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

const filteredFields = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return fields.value;
  return fields.value.filter(f => 
    f.field_cn_name.toLowerCase().includes(q) || 
    f.field_en_name.toLowerCase().includes(q)
  );
});

const handleClearAll = () => {
  ElMessageBox.confirm('警告：此操作将永久清空标准库和向量索引！', '高危操作', { 
    confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'error' 
  }).then(async () => {
    const loadingInstance = ElLoading.service({ text: '清理中...' });
    try {
      const res = await dictionaryApi.clearAllFields();
      ElMessage.success(res.data);
      await fetchFields();
    } finally {
      loadingInstance.close();
    }
  }).catch(() => {});
};

onMounted(fetchFields);
</script>

<style scoped>
.en-code {
  background: #f0f7ff; color: #409eff; padding: 3px 8px; border-radius: 4px; font-family: 'Consolas', monospace; font-weight: bold;
}
.analysis-box {
  background: #f8f9fa; padding: 18px; border-radius: 8px; margin: 0 0 20px 0; border: 1px dashed #dcdfe6;
}
.box-title { font-size: 13px; color: #606266; margin-bottom: 15px; font-weight: bold; }
.segment-chain { display: flex; flex-wrap: wrap; gap: 15px; }
.segment-item {
  background: #fff; border: 1px solid #e4e7ed; border-radius: 6px; padding: 10px; min-width: 140px; display: flex; flex-direction: column;
}
.segment-item.is-missing { border-color: #f56c6c; background: #fffbfa; }
.original-word { font-size: 12px; color: #909399; margin-bottom: 8px; text-align: center; border-bottom: 1px solid #f2f6fc; padding-bottom: 4px; }
.candidate-list { display: flex; flex-direction: column; gap: 5px; }
.root-tag { width: 100%; text-align: left; cursor: pointer; height: auto; padding: 4px 8px; }
.cand-cn { font-size: 11px; opacity: 0.7; margin-left: 4px; }
.missing-status { text-align: center; padding: 5px 0; }
.en-preview-bar {
  margin-top: 20px; padding: 12px; background: #f0f9eb; border-radius: 4px; display: flex; align-items: center; border: 1px solid #e1f3d8;
}
.preview-label { font-size: 13px; color: #67c23a; margin-right: 10px; }
.preview-value { font-family: 'Consolas', monospace; font-size: 16px; color: #303133; }
.text-danger { color: #f56c6c; }
.status-empty { color: #c0c4cc; text-align: center; font-size: 13px; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.field-container { padding: 10px; }
.right .el-button { margin-left: 10px; }
</style>