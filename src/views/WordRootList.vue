<template>
  <div class="root-container">
    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input v-model="searchQuery" placeholder="搜索中文名或英文缩写" style="width: 300px" clearable @input="handleSearch"
          :prefix-icon="Search" />
      </div>
      <div class="right">
        <!-- 一键清空按钮 -->
        <el-button type="danger" plain :icon="Delete" @click="handleClearAll">
          清空所有
        </el-button>

        <el-divider direction="vertical" />

        <el-button type="success" :icon="Download" @click="handleExport">
          导出 Excel
        </el-button>

        <el-upload action="" :auto-upload="false" :show-file-list="false" accept=".xlsx, .xls" :on-change="handleImport"
          style="display: inline-block; margin: 0 8px">
          <el-button type="warning" :icon="Upload">导入 Excel</el-button>
        </el-upload>

        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          新增词根
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="roots" border v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="cn_name" label="中文名称" width="150" />
      <el-table-column prop="en_full_name" label="英文全称" width="180" show-overflow-tooltip />
      <el-table-column prop="en_abbr" label="英文缩写" width="150" align="center">
        <template #default="{ row }">
          <code class="en-code">{{ row.en_abbr }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="associated_terms" label="同义词" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[20, 50, 100, 200]"
        background layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 弹窗部分 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑词根' : '新增词根'" width="550px" @closed="resetForm">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules" label-position="left">
        <el-form-item label="中文名称" prop="cn_name">
          <el-input v-model="form.cn_name" placeholder="如：金额" />
        </el-form-item>
        <el-form-item label="英文全称" prop="en_full_name">
          <el-input v-model="form.en_full_name" placeholder="如：Amount" />
        </el-form-item>
        <el-form-item label="英文缩写" prop="en_abbr">
          <el-input v-model="form.en_abbr" placeholder="如：amt" />
        </el-form-item>
        <el-form-item label="同义词" prop="associated_terms">
          <el-input v-model="form.associated_terms" placeholder="多个同义词请用【空格】隔开，如：金额 钱 费用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoot" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search, Download, Upload, Delete } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import type { WordRoot } from '../types';
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus';
import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';

// --- 状态变量 ---
const loading = ref(false);
const submitting = ref(false);
const roots = ref<WordRoot[]>([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const formRef = ref();

// 分页相关
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const form = ref<WordRoot>({
  cn_name: '',
  en_abbr: '',
  en_full_name: '',
  associated_terms: '',
  remark: ''
});

const rules = {
  cn_name: [{ required: true, message: '请输入中文名称', trigger: 'blur' }],
  en_abbr: [{ required: true, message: '请输入英文缩写', trigger: 'blur' }],
};

// --- 核心加载逻辑 ---
const fetchRoots = async () => {
  logger.info("Root:UI", "请求加载词根分页列表", { page: currentPage.value, size: pageSize.value, q: searchQuery.value });
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getRoots(currentPage.value, pageSize.value, searchQuery.value);
    roots.value = data.items;
    total.value = data.total;
    logger.debug("Root:Data", "词根数据同步完成", { count: data.items.length, total: data.total });
  } catch (error) {
    // 拦截器已处理日志
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchRoots();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchRoots();
};

let timer: any = null;
const handleSearch = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    logger.info("Root:UI", "触发服务端搜索", searchQuery.value);
    currentPage.value = 1;
    fetchRoots();
  }, 400);
};

// --- 危险操作：一键清空 ---
const handleClearAll = () => {
  ElMessageBox.confirm(
    '此操作将永久清空数据库和向量库中的【所有】词根！建议操作前先执行导出备份。',
    '高危清理指令',
    { confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'error', confirmButtonClass: 'el-button--danger' }
  ).then(async () => {
    logger.warn("Root:Action", "管理员执行全量清空指令");
    const loadingInstance = ElLoading.service({ text: '正在清理全局索引...' });
    try {
      const res = await dictionaryApi.clearAllRoots();
      logger.info("Root:Action", "清空任务成功完成", res.data);
      ElMessage.success(res.data);
      currentPage.value = 1;
      await fetchRoots();
    } catch (error) {
      // 错误已拦截
    } finally {
      loadingInstance.close();
    }
  }).catch(() => { logger.debug("Root:UI", "用户取消了清空操作"); });
};

// --- 导出逻辑 ---
const handleExport = async () => {
  logger.info("Root:Action", "开始全量导出词根数据");
  const loadingInstance = ElLoading.service({ text: '正在扫描全表数据并生成文件...' });
  try {
    const { data } = await dictionaryApi.getRoots(1, 10000, searchQuery.value);
    
    const exportData = data.items.map((r, index) => ({
      "序号": index + 1,
      "中文名称": r.cn_name,
      "英文全称": r.en_full_name || '',
      "英文缩写": r.en_abbr,
      "同义词": r.associated_terms || '',
      "备注": r.remark || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "标准词根库");
    XLSX.writeFile(wb, `词根导出_${new Date().getTime()}.xlsx`);
    logger.info("Root:Action", "Excel 导出成功");
    ElMessage.success("全量导出成功");
  } catch (e) {
    logger.error("Root:Action", "导出任务崩溃", e);
  } finally {
    loadingInstance.close();
  }
};

// --- 导入逻辑 ---
const handleImport = (file: any) => {
  logger.info("Root:Action", "准备导入 Excel 文件", file.name);
  const reader = new FileReader();
  reader.onload = async (e: any) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const wsName = workbook.SheetNames[0];
      if (!wsName) return;
      const worksheet = workbook.Sheets[wsName];
      if (!worksheet) return;

      const json: any[] = XLSX.utils.sheet_to_json(worksheet);
      logger.debug("Root:Data", "Excel 解析原始行数", json.length);

      const formattedData = json.map((item: any) => ({
        cn_name: String(item["中文名称"] || "").trim(),
        en_full_name: String(item["英文全称"] || "").trim(),
        en_abbr: String(item["英文缩写"] || "").trim(),
        associated_terms: String(item["同义词"] || "").trim(),
        remark: String(item["备注"] || "").trim()
      })).filter(item => item.cn_name && item.en_abbr);

      logger.info("Root:Action", "数据格式化完成，准备推送后端", { validRows: formattedData.length });

      if (formattedData.length === 0) {
        ElMessage.error("未找到有效数据");
        return;
      }

      const loadingInstance = ElLoading.service({ text: '同步数据并构建向量索引中...' });
      try {
        const res = await dictionaryApi.batchCreateRoots(formattedData);
        const result = res.data;
        logger.info("Root:Service", "批量导入接口结果回执", result);

        if (result.failure_count > 0) {
          ElMessageBox.confirm(
            `导入报告：成功 ${result.success_count}，失败 ${result.failure_count}。是否下载失败原因列表？`,
            '批量导入结果',
            { confirmButtonText: '查看详情', cancelButtonText: '关闭', type: 'warning' }
          ).then(() => {
            ElMessageBox.alert(
              `<div style="max-height:300px;overflow:auto;color:#f56c6c">${result.errors.join('<br/>')}</div>`,
              '失败原因清单',
              { dangerouslyUseHTMLString: true }
            );
          });
        } else {
          ElMessage.success(`导入成功，共 ${result.success_count} 条`);
        }
        currentPage.value = 1;
        await fetchRoots();
      } catch (err: any) {
        logger.error("Root:Service", "批量导入网络异常", err);
      } finally {
        loadingInstance.close();
      }
    } catch (err) {
      logger.error("Root:Action", "本地文件解析异常", err);
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

// --- CRUD 操作 ---
const openAddDialog = () => { 
  logger.debug("Root:UI", "打开新增词根对话框");
  form.value = { cn_name: '', en_abbr: '', en_full_name: '', associated_terms: '', remark: '' };
  dialogVisible.value = true; 
};

const handleEdit = (row: WordRoot) => {
  logger.debug("Root:UI", "进入编辑模式", { id: row.id });
  form.value = { ...row };
  dialogVisible.value = true;
};

const handleDelete = async (id: number) => {
  logger.warn("Root:Action", `执行删除操作，ID: ${id}`);
  try {
    await dictionaryApi.deleteRoot(id);
    ElMessage.success('已删除');
    await fetchRoots();
  } catch (e) { /* 处理已由拦截器记录 */ }
};

const saveRoot = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const isEdit = !!form.value.id;
      logger.info("Root:Action", isEdit ? "提交更新请求" : "提交新增请求", form.value);
      submitting.value = true;
      try {
        if (isEdit) {
          await dictionaryApi.updateRoot(form.value.id!, form.value);
        } else {
          await dictionaryApi.createRoot(form.value);
        }
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        await fetchRoots();
      } finally {
        submitting.value = false;
      }
    }
  });
};

const resetForm = () => {
  logger.debug("Root:UI", "重置词根表单数据");
  form.value = { cn_name: '', en_abbr: '', en_full_name: '', associated_terms: '', remark: '' };
};

onMounted(fetchRoots);
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.en-code { background: #f0f7ff; color: #409eff; padding: 3px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-weight: bold; }
.root-container { padding: 10px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
:deep(.el-upload) { display: inline-block; }
.right .el-button { margin-left: 8px; }
</style>