<template>
    <div class="field-container">
        <div class="toolbar">
            <el-input v-model="searchQuery" placeholder="搜索标准字段名..." style="width: 300px" clearable />
            <el-tag type="info">标准字段总数: {{ filteredFields.length }}</el-tag>
        </div>

        <el-table :data="filteredFields" border v-loading="loading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="field_cn_name" label="中文全称" width="200" />
            <el-table-column prop="field_en_name" label="英文标准名" width="220">
                <template #default="{ row }">
                    <b style="color: #409eff; font-family: monospace">{{ row.field_en_name }}</b>
                </template>
            </el-table-column>
            <el-table-column prop="data_type" label="数据类型" width="120" />
            <el-table-column label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.is_standard ? 'success' : 'warning'">
                        {{ row.is_standard ? '已审核' : '待确认' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEditField(row)">编辑</el-button>
                    <el-button link @click="showDetail(row)">组成</el-button>
                    <el-popconfirm title="确定从标准库移除吗？" @confirm="handleDeleteField(row.id)">
                        <template #reference>
                            <el-button link type="danger">删除</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>

        <!-- 编辑弹窗 -->
        <el-dialog v-model="editVisible" title="编辑标准字段" width="450px">
            <el-form :model="editForm" label-width="100px">
                <el-form-item label="中文名称">
                    <el-input v-model="editForm.field_cn_name" />
                </el-form-item>
                <el-form-item label="数据类型">
                    <el-select v-model="editForm.data_type" style="width: 100%">
                        <el-option label="VARCHAR(50)" value="VARCHAR(50)" />
                        <el-option label="INT" value="INT" />
                        <el-option label="TIMESTAMP" value="TIMESTAMP" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmUpdateField">保存</el-button>
            </template>
        </el-dialog>

        <!-- 详情抽屉：查看词根组成 -->
        <el-drawer v-model="drawerVisible" title="字段组成详情" size="400px">
            <div v-if="selectedField">
                <h3>{{ selectedField.field_cn_name }}</h3>
                <p>英文名: <code>{{ selectedField.field_en_name }}</code></p>
                <el-divider />
                <p><b>组成词根解析：</b></p>
                <el-timeline v-if="detailRoots.length > 0">
                    <el-timeline-item v-for="root in detailRoots" :key="root.id" :timestamp="root.en_abbr"
                        placement="top">
                        <el-card shadow="never">
                            <h4>{{ root.cn_name }}</h4>
                            <p v-if="root.remark" style="font-size: 12px; color: #999">{{ root.remark }}</p>
                        </el-card>
                    </el-timeline-item>
                </el-timeline>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { dictionaryApi } from '../api';
import type { StandardField, WordRoot } from '../types';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const fields = ref<StandardField[]>([]);
const searchQuery = ref('');

// 详情相关
const drawerVisible = ref(false);
const selectedField = ref<StandardField | null>(null);
const detailRoots = ref<WordRoot[]>([]);

const editVisible = ref(false);
const editForm = ref<any>({});

const handleEditField = (row: StandardField) => {
  editForm.value = { ...row };
  editVisible.value = true;
};

const confirmUpdateField = async () => {
  await dictionaryApi.updateField(editForm.value.id, editForm.value);
  ElMessage.success('更新成功');
  editVisible.value = false;
  fetchFields();
};

const handleDeleteField = async (id: number) => {
  await dictionaryApi.deleteField(id);
  ElMessage.success('已移除');
  fetchFields();
};

const fetchFields = async () => {
    loading.value = true;
    try {
        const { data } = await dictionaryApi.getFields();
        fields.value = data;
    } finally {
        loading.value = false;
    }
};

const filteredFields = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return fields.value.filter(f =>
        f.field_cn_name.toLowerCase().includes(q) ||
        f.field_en_name.toLowerCase().includes(q)
    );
});

const showDetail = async (row: StandardField) => {
    selectedField.value = row;
    drawerVisible.value = true;
    // 调用后端 get_field_details 接口
    try {
        const { data } = await dictionaryApi.getFieldDetails(row.id!);
        detailRoots.value = data;
    } catch (e) {
        console.error("加载详情失败");
    }
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
    align-items: center;
}
</style>