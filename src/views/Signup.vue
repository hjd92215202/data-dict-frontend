<template>
  <div class="signup-container">
    <el-card class="signup-card">
      <template #header><h2>新管理员注册申请</h2></template>
      <el-form :model="form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="设置用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="设置密码" show-password prefix-icon="Lock" />
        </el-form-item>
        <el-button type="success" @click="handleSignup" :loading="loading" style="width: 100%">
          提交注册
        </el-button>
        <div class="link">
          <el-button link @click="$router.push('/login')">已有账号？去登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { dictionaryApi } from '../api';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

const handleSignup = async () => {
  loading.value = true;
  try {
    await dictionaryApi.signup(form);
    ElMessage.success('注册成功，请联系系统管理员通过审核（或手动改DB角色）');
    router.push('/login');
  } catch (e: any) {
    ElMessage.error(e.response?.data || '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.signup-container { height: 100vh; display: flex; justify-content: center; align-items: center; background: #2d3a4b; }
.signup-card { width: 400px; }
.link { text-align: center; margin-top: 15px; }
</style>