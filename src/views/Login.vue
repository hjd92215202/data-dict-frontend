<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-title">数据标准系统登录</div>
      </template>

      <el-form :model="form" @keyup.enter="handleLogin">
        <el-form-item>
          <!-- 这里使用图标组件 -->
          <el-input v-model="form.username" placeholder="用户名">
            <template #prefix><el-icon>
                <User />
              </el-icon></template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" show-password>
            <template #prefix><el-icon>
                <Lock />
              </el-icon></template>
          </el-input>
        </el-form-item>

        <el-button type="primary" :loading="loading" @click="handleLogin" class="w-full">
          登录系统
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { dictionaryApi } from '../api';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
// 确保这些图标被模板用到
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

const form = reactive({
  username: '',
  password: ''
});

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请完整填写信息');
    return;
  }

  loading.value = true;
  try {
    const { data } = await dictionaryApi.login(form);

    // 核心：存储凭证
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);

    ElMessage.success('欢迎回来');

    if (data.role === 'admin') {
      // 管理员去后台
      router.push('/admin/fields');
    } else {
      // 普通用户去查询页
      router.push('/');
    }
  } catch (error: any) {
    console.error(error);
    ElMessage.error(error.response?.data || '登录验证失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b;
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.w-full {
  width: 100%;
}
</style>