<template>
    <div class="login-container">
      <div class="login-box">
        <h2>欢迎登录</h2>
        <form @submit.prevent="handleSubmit">
          <div class="input-group">
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="username" placeholder="请输入用户名">
            <p class="error-message" v-if="usernameError">{{ usernameError }}</p>
          </div>
          <div class="input-group">
            <label for="password">密码</label>
            <input type="password" id="password" v-model="password" placeholder="请输入密码">
            <p class="error-message" v-if="passwordError">{{ passwordError }}</p>
          </div>
          <button type="submit" :disabled="isSubmitting">
            <span v-if="!isSubmitting">登录</span>
            <span v-else>登录中...</span>
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const username = ref('');
  const password = ref('');
  const usernameError = ref('');
  const passwordError = ref('');
  const isSubmitting = ref(false);
  
  const validateUsername = () => {
    if (!username.value.trim()) {
      usernameError.value = '用户名不能为空';
      return false;
    } else {
      usernameError.value = '';
      return true;
    }
  };
  
  const validatePassword = () => {
    if (!password.value.trim()) {
      passwordError.value = '密码不能为空';
      return false;
    } else {
      passwordError.value = '';
      return true;
    }
  };
  
  const handleSubmit = async () => {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
  
    if (isUsernameValid && isPasswordValid) {
      isSubmitting.value = true;
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      isSubmitting.value = false;
      alert('登录成功！');
      // 在这里处理实际的登录逻辑，例如发送 API 请求
      console.log('用户名:', username.value);
      console.log('密码:', password.value);

      // 登录成功后可以进行页面跳转或其他操作
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f4f4f4;
  }
  
  .login-box {
    background-color: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 350px;
    text-align: center;
  }
  
  h2 {
    margin-bottom: 20px;
    color: #333;
  }
  
  .input-group {
    margin-bottom: 15px;
    text-align: left;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    color: #555;
    font-size: 14px;
  }
  
  input[type="text"],
  input[type="password"] {
    width: calc(100% - 22px);
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  
  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }
  
  .error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
  }
  
  button {
    background-color: #007bff;
    color: #fff;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
    width: 100%;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  </style>