<template>
  <div class="login">
    <a-form
      name="custom-validation"
      ref="formRef"
      :model="formState"
      :rules="rules"
      v-bind="layout"
      @finish="handleFinish"
    >
      <a-form-item label="用户名" name="user">
        <a-input v-model:value="formState.user" />
      </a-form-item>
      <a-form-item label="密码" name="password">
        <a-input v-model:value="formState.password" type="password" />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
        <a-button type="primary" html-type="submit">提交</a-button>
        <a-button type="link" style="margin-left: 10px" @click="goToRegister">注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
    import { reactive, ref,  } from 'vue';
    import type {UnwrapRef}from  'vue'
    import { useRouter } from 'vue-router';
    import axios  from 'axios'
    import { notification } from 'ant-design-vue';
    const router = useRouter()

    interface FormState {
      user: string;
      password: string;
    }

    const formRef = ref();
    const formState: UnwrapRef<FormState> = reactive({
      user: '',
      password: '',
    });



   const rules = {
      user: [{ required: true }],
      password: [{ required: true}],
    };
    const layout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 16 },
    };
    const handleFinish = async (values: FormState) => {
    try {
        const res = await axios.post('http://localhost:3000/login', {
            username: values.user,
            password: values.password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (res.data.code === 200) {
            notification.success({
                message: '登录成功',
                description: '欢迎回来！',
                duration: 3
            })
            router.push('/Main')
        } else {
            notification.error({
                message: '登录失败',
                description: res.data.message || '账号或密码错误',
                duration: 3
            })
        }
    } catch (error) {
        notification.error({
            message: '请求错误',
            description: '服务器异常或网络错误',
            duration: 3
        })
    }
}
  
      const goToRegister = () => {
          router.push('/register')
      }


</script>


<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login :deep(.ant-form) {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  min-width: 400px;
}
</style>
