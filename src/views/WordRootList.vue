<template>
  <div class="root-container">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-input v-model="searchQuery" placeholder="搜索中文名或英文缩写" style="width: 300px" clearable @input="handleSearch" />
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        新增词根
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="filteredRoots" border v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="cn_name" label="中文名称" width="150" />
      <el-table-column prop="en_abbr" label="英文缩写" width="150">
        <template #default="{ row }">
          <code class="en-code">{{ row.en_abbr }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="associated_terms" label="同义词" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑词根' : '新增词根'" width="500px">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules">
        <el-form-item label="中文名称" prop="cn_name">
          <el-input v-model="form.cn_name" placeholder="如：金额" />
        </el-form-item>
        <el-form-item label="英文缩写" prop="en_abbr">
          <el-input v-model="form.en_abbr" placeholder="如：amt" />
        </el-form-item>
        <el-form-item label="同义词" prop="associated_terms">
          <el-input v-model="form.associated_terms" placeholder="多个用逗号隔开，如：钱,费用,价格" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
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
import { ref, onMounted, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import type { WordRoot } from '../types';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const submitting = ref(false);
const roots = ref<WordRoot[]>([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const formRef = ref();

const form = ref<WordRoot>({
  cn_name: '',
  en_abbr: '',
  associated_terms: '',
  remark: ''
});

const rules = {
  cn_name: [{ required: true, message: '请输入中文名称', trigger: 'blur' }],
  en_abbr: [{ required: true, message: '请输入英文缩写', trigger: 'blur' }],
};

// 获取数据
const fetchRoots = async () => {
  loading.value = true; // 修正：这里之前是 loading.ref，应改为 .value
  try {
    const { data } = await dictionaryApi.getRoots();
    roots.value = data;
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索回调（如果 template 中有 @input="handleSearch"）
const handleSearch = () => {
  // filteredRoots 是计算属性，会自动随 searchQuery 变化
  // 这里可以留空，或者放一些特殊的搜索埋点逻辑
  console.log('Searching for:', searchQuery.value);
};

// 过滤逻辑
const filteredRoots = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return roots.value;
  return roots.value.filter(r =>
    r.cn_name.toLowerCase().includes(q) ||
    r.en_abbr.toLowerCase().includes(q) ||
    (r.associated_terms && r.associated_terms.toLowerCase().includes(q))
  );
});

const openAddDialog = () => {
  form.value = { cn_name: '', en_abbr: '', associated_terms: '', remark: '' };
  dialogVisible.value = true;
};

const handleEdit = (row: WordRoot) => {
  form.value = { ...row }; // 拷贝数据
  dialogVisible.value = true;
};

const handleDelete = async (id: number) => {
  try {
    await dictionaryApi.deleteRoot(id);
    ElMessage.success('已删除');
    fetchRoots();
  } catch (e) { ElMessage.error('删除失败'); }
};

const saveRoot = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        await dictionaryApi.createRoot(form.value);
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        await fetchRoots(); // 刷新列表
      } catch (error: any) {
        ElMessage.error('保存失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

onMounted(fetchRoots);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.en-code {
  background: #f4f4f5;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.root-container {
  padding: 10px;
}
</style>