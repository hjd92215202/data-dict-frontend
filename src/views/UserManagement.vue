<template>
  <div class="user-management-container">
    <el-card shadow="never" class="main-card">
      <!-- 头部操作区 -->
      <template #header>
        <div class="card-header">
          <div class="title-group">
            <span class="title">用户权限管理</span>
            <el-tag type="info" size="small" class="ml-2">总计 {{ users.length }} 名用户</el-tag>
          </div>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            开通新账号
          </el-button>
        </div>
      </template>

      <!-- 用户数据表格 -->
      <el-table :data="users" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="登录账号" min-width="150" />
        
        <el-table-column label="当前角色" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" effect="dark">
              {{ row.role === 'admin' ? '超级管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="注册时间" width="200">
          <template #default="{ row }">
            {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="权限及账号操作" width="280" fixed="right">
          <template #default="{ row }">
            <!-- 角色切换：不能降权自己（建议在生产环境增加此逻辑） -->
            <el-button 
              v-if="row.role !== 'admin'" 
              link 
              type="warning" 
              @click="handleRoleChange(row, 'admin')"
            >
              设为管理员
            </el-button>
            <el-button 
              v-else 
              link 
              type="info" 
              @click="handleRoleChange(row, 'user')"
            >
              降为普通用户
            </el-button>

            <el-divider direction="vertical" />

            <!-- 删除操作 -->
            <el-popconfirm 
              :title="`确定要永久删除用户 [${row.username}] 吗？`"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger">注销账号</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增用户对话框 -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="开通内部员工账号" 
      width="450px"
      @closed="resetAddForm"
      destroy-on-close
    >
      <el-form 
        :model="addForm" 
        ref="addFormRef" 
        :rules="addRules" 
        label-width="80px"
        label-position="top"
      >
        <el-form-item label="登录用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="建议使用姓名拼音" />
        </el-form-item>
        
        <el-form-item label="初始登录密码" prop="password">
          <el-input 
            v-model="addForm.password" 
            type="password" 
            show-password 
            placeholder="请设置至少6位密码" 
          />
        </el-form-item>

        <el-form-item label="分配初始角色" prop="role">
          <el-radio-group v-model="addForm.role">
            <el-radio label="user" border>普通用户 (仅查询)</el-radio>
            <el-radio label="admin" border>管理员 (增删改)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddUser" :loading="addLoading">
            确认创建
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { dictionaryApi } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- 基础状态 ---
const users = ref<any[]>([]);
const loading = ref(false);

// --- 新增用户相关 ---
const addDialogVisible = ref(false);
const addLoading = ref(false);
const addFormRef = ref();
const addForm = reactive({
  username: '',
  password: '',
  role: 'user'
});

const addRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, message: '用户名至少3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色权限', trigger: 'change' }
  ]
};

// --- 核心方法 ---

// 1. 加载用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const { data } = await dictionaryApi.getUsers();
    users.value = data;
  } catch (error) {
    console.error("加载用户失败", error);
  } finally {
    loading.value = false;
  }
};

// 2. 打开新增弹窗
const openAddDialog = () => {
  addDialogVisible.value = true;
};

// 3. 提交创建请求
const submitAddUser = async () => {
  if (!addFormRef.value) return;
  
  await addFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      addLoading.value = true;
      try {
        await dictionaryApi.adminCreateUser(addForm);
        ElMessage.success(`用户 ${addForm.username} 创建成功`);
        addDialogVisible.value = false;
        await fetchUsers(); // 刷新列表
      } catch (error: any) {
        ElMessage.error(error.response?.data || '创建失败，请检查用户名是否重复');
      } finally {
        addLoading.value = false;
      }
    }
  });
};

// 4. 修改用户角色
const handleRoleChange = (row: any, newRole: string) => {
  const roleName = newRole === 'admin' ? '管理员' : '普通用户';
  
  ElMessageBox.confirm(
    `确认将用户 [${row.username}] 的角色修改为 [${roleName}] 吗？`,
    '权限变更确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await dictionaryApi.updateUserRole(row.id, newRole);
      ElMessage.success('权限更新成功');
      await fetchUsers();
    } catch (e) {
      ElMessage.error('权限更新失败');
    }
  }).catch(() => {});
};

// 5. 删除用户
const handleDelete = async (id: number) => {
  try {
    await dictionaryApi.deleteUser(id);
    ElMessage.success('用户账号已注销');
    await fetchUsers();
  } catch (e) {
    ElMessage.error('删除操作失败');
  }
};

// 重置表单
const resetAddForm = () => {
  addForm.username = '';
  addForm.password = '';
  addForm.role = 'user';
  if (addFormRef.value) addFormRef.value.resetFields();
};

onMounted(fetchUsers);
</script>

<style scoped>
.user-management-container {
  padding: 10px;
}

.main-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.ml-2 {
  margin-left: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 让单选框组美观一点 */
:deep(.el-radio.is-bordered) {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style>