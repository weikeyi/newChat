<template>
    <div class="register">
        <a-form
            ref="formRef"
            :model="formState"
            :rules="rules"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @submit.prevent="handleRegister"
        >
            <a-form-item label="用户名" name="username">
                <a-input v-model:value="formState.username" placeholder="请输入用户名" />
            </a-form-item>

            <a-form-item label="密码" name="password">
                <a-input
                    type="password"
                    v-model:value="formState.password"
                    placeholder="请输入密码"
                />
            </a-form-item>

            <a-form-item label="确认密码" name="confirm">
                <a-input
                    type="password"
                    v-model:value="formState.confirm"
                    placeholder="请确认密码"
                />
            </a-form-item>

            <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
                <a-button type="primary" html-type="submit">注册</a-button>
                <a-button type="link" @click="goToLogin" style="margin-left: 10px"
                    >返回登录</a-button
                >
            </a-form-item>
        </a-form>
    </div>
</template>

<script lang="ts" setup>
    import { reactive, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import axios from 'axios'
    import { notification } from 'ant-design-vue'
    import type { Rule } from 'ant-design-vue/es/form'

    const router = useRouter()
    const formRef = ref()

    interface FormState {
        username: string
        password: string
        confirm: string
    }

    const formState = reactive<FormState>({
        username: '',
        password: '',
        confirm: '',
    })

    const validateConfirm: Rule['validator'] = async (_, value) => {
        if (!value) {
            return Promise.reject('请确认密码')
        }
        if (value !== formState.password) {
            return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
    }

    const rules = {
        username: [{ required: true, message: '请输入用户名' }],
        password: [{ required: true, message: '请输入密码' }],
        confirm: [{ required: true, validator: validateConfirm }],
    }

    const handleRegister = async () => {
        try {
            const res = await axios.post('http://localhost:3000/user/create', {
                username: formState.username,
                password: formState.password,
            })

            if (res.status === 200) {
                if (res.data.token) {
                    notification.success({ message: '注册成功,请登录', duration: 3 })
                    router.push('/')
                }
            } else {
                notification.error({
                    message: '注册失败',
                    description: res.data.message || '未知错误',
                })
            }
        } catch (err) {
            notification.error({ message: '网络异常', description: '请稍后重试' })
        }
    }

    const goToLogin = () => {
        router.push('/')
    }
</script>

<style scoped>
    .register {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }
    .register :deep(.ant-form) {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        min-width: 400px;
    }
</style>
