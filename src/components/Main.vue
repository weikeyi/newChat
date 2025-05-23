<script setup lang="ts">
    import type {
        AttachmentsProps,
        BubbleListProps,
        // ConversationsProps,
        // BubbleProps, // 如果 renderMarkdown 直接在 Bubble.List 中使用，可能不需要导入
    } from 'ant-design-x-vue'
    import {
        CloudUploadOutlined,
        PaperClipOutlined,
        PlusOutlined,
        // UserOutlined,
    } from '@ant-design/icons-vue'
    import { Badge, Button, Flex, Typography, theme } from 'ant-design-vue'
    import {
        Attachments,
        Bubble,
        Conversations,
        Welcome,
        Sender,
        useXAgent,
        useXChat,
        // XStream, // 已移至 aiService
    } from 'ant-design-x-vue'
    import { computed, onMounted, ref, h } from 'vue'

    // 重构后的导入
    // import { useChatStore } from '../stores/chat'; // 已在 useChatManager 中使用
    // import { renderMarkdown } from '../utils/markdownUtils'
    import { getHeader } from '../utils/apiUtils'
    // import getUserId from '../utils/getUserId'; // 现在在 useChatManager 内部使用
    import { roles as chatRoles } from '../config/chatConfig' // 重命名以避免冲突
    import { streamAIChatResponse } from '../services/aiService'
    import { useChatManager } from '../composables/useChatManager'
    // import { useChatStyles } from '../composables/useChatStyles'; // 如果你创建了这个文件

    defineOptions({ name: 'PlaygroundIndependentSetup' })

    const { token } = theme.useToken() // Ant Design 的 token

    // 使用可组合函数处理样式 (或者如果简单则直接定义)
    // const styles = useChatStyles(token);
    // 如果没有创建 useChatStyles，为简单起见，直接定义:
    const styles = computed(() => {
        return {
            layout: {
                width: '100%',
                'min-width': '1000px',
                height: '100vh',
                'border-radius': `${token.value.borderRadius}px`,
                display: 'flex',
                background: `${token.value.colorBgContainer}`,
                'font-family': `AlibabaPuHuiTi, ${token.value.fontFamily}, sans-serif`,
            },
            menu: {
                background: `${token.value.colorBgLayout}80`,
                width: '280px',
                height: '100%',
                display: 'flex',
                'flex-direction': 'column',
            },
            conversations: { padding: '0 12px', flex: 1, 'overflow-y': 'auto' },
            chat: {
                background: `${token.value.colorFillQuaternary}`,
                height: '100%',
                width: '100%',
                'max-width': '1700px',
                margin: '0 auto',
                'box-sizing': 'border-box',
                display: 'flex',
                'flex-direction': 'column',
                padding: `${token.value.paddingLG}px`,
                gap: '16px',
            },
            messages: { flex: 1 },
            placeholder: { 'padding-top': '32px', 'text-align': 'left', flex: 1 },
            sender: { 'box-shadow': token.value.boxShadow, 'max-width': '700px', margin: '0 auto' },
            logo: {
                display: 'flex',
                height: '72px',
                'align-items': 'center',
                'justify-content': 'start',
                padding: '0 24px',
                'box-sizing': 'border-box',
            },
            'logo-img': { width: '24px', height: '24px', display: 'inline-block' },
            'logo-span': {
                display: 'inline-block',
                margin: '0 8px',
                'font-weight': 'bold',
                color: token.value.colorText,
                'font-size': '16px',
            },
            addBtn: {
                background: '#1677ff0f',
                border: '1px solid #1677ff34',
                width: 'calc(100% - 24px)',
                margin: '0 12px 24px 12px',
            },
        } as const
    })

    const placeholderNode = computed(() =>
        h(Welcome, {
            variant: 'borderless',
            icon: 'https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp', // 一张图标图片
            title: '欢迎来到这里！',
            description:
                '很高兴能与您相遇。无论您是想获取信息、解决问题，还是单纯想聊聊天，我都在这里陪伴您。请随时提出您的需求，我会尽最大努力为您提供帮助。让我们一起开启一段愉快的交流吧！😊',
        })
    )

    // 由组件直接管理的UI特定状态
    const headerOpen = ref(false)
    const content = ref('') // Sender 输入框的内容
    const attachedFiles = ref<AttachmentsProps['items']>([])
    const agentRequestLoading = ref(false) // Agent 请求加载状态

    // 设置 Agent
    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onError, onUpdate }) => {
            agentRequestLoading.value = true // 设置加载状态
            try {
                let reasoningText = ''
                let outputText = ''

                // 使用从 aiService 导入的异步生成器
                for await (const streamEvent of streamAIChatResponse(message as string, getHeader())) {
                    if (streamEvent.type === 'done') {
                        // 拼接最终完整文本
                        const fullMarkdown = [
                            reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                            outputText,
                        ]
                            .filter(Boolean)
                            .join('\n\n')
                        onSuccess?.(fullMarkdown)
                        break
                    }

                    if (streamEvent.type === 'error') {
                        onError?.(streamEvent.payload)
                        break
                    }

                    if (streamEvent.type === 'data') {
                        const parsedChunk = streamEvent.payload
                        // 确保 parsedChunk 和 content 有效
                        if (!parsedChunk || typeof parsedChunk.content !== 'string') continue

                        if (parsedChunk.type === 'reasoning') {
                            reasoningText += parsedChunk.content
                        } else if (parsedChunk.type === 'output') {
                            outputText += parsedChunk.content
                        }

                        // 实时组合展示
                        const liveMarkdown = [
                            reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                            outputText,
                        ]
                            .filter(Boolean)
                            .join('\n\n')
                        onUpdate?.(liveMarkdown)
                    }
                }
            } catch (err: any) {
                // 捕获 streamAIChatResponse 本身可能抛出的未处理错误
                console.error('[Agent 请求包装器错误]', err)
                onError?.(err.message || 'Agent 请求中发生未处理的错误')
            } finally {
                agentRequestLoading.value = false // 清除加载状态
            }
        },
    })

    // 设置 XChat (提供响应式的 messages 数组)
    const {
        onRequest,
        messages,
        setMessages: setXChatMessages,
    } = useXChat({
        agent: agent.value,
    })

    // 设置聊天管理器可组合函数
    const {
        // currentUserId, // 由 useChatManager 暴露，但这里可能不需要直接使用
        conversationsItems,
        activeKey,
        initializeUserSession,
        handleAddConversation, // 从 composable 获取的方法
        handleConversationClick, // 从 composable 获取的方法
    } = useChatManager(setXChatMessages,messages) // 传入 setXChatMessages 回调

    // 组件挂载后初始化用户会话
    onMounted(() => {
        initializeUserSession()
    })

    // 模板事件处理器
    function onSubmitMessage(nextContent: string) {
        if (!nextContent.trim()) return // 避免发送空消息
        onRequest(nextContent) // 调用 useXChat 提供的 onRequest
        content.value = '' // 清空输入框
    }

    function onNewConversation() {
        handleAddConversation() // 调用 composable 中的方法
    }

    function onSwitchConversation(newKey: string | number | undefined) {
        if (newKey !== undefined) {
            // 确保 key 不是 undefined
            handleConversationClick(String(newKey)) // 调用 composable 中的方法，确保是 string
        }
    }

    const handleFileChange: AttachmentsProps['onChange'] = info =>
        (attachedFiles.value = info.fileList || []) // 确保 fileList 存在

    // 为 Bubble.List 计算 items
    const bubbleListItems = computed<BubbleListProps['items']>(() => {
        // 如果有激活的对话但消息为空，显示 placeholderNode
        if (messages.value.length === 0 && activeKey.value !== undefined) {
            return [{ content: placeholderNode, variant: 'borderless' }]
        }
        // 如果没有激活的对话 (例如，刚加载还没有对话，或者所有对话被删除)
        if (messages.value.length === 0 && activeKey.value === undefined) {
            return [{ content: placeholderNode, variant: 'borderless' }] // 或者显示一个通用的欢迎信息
        }
        return messages.value.map(({ id, message, status }) => ({
            key: String(id), // 确保 key 是字符串
            role: status === 'local' ? 'local' : 'ai', // 根据 status 判断角色
            content: message,
            // 如果 renderMarkdown 是全局应用，则不需要在这里指定 messageRender
            // 如果是按角色指定，则 chatRoles 中已包含
        }))
    })
</script>

<template>
    <div :style="styles.layout">
        <div :style="styles.menu">
            <div :style="styles.logo">
                <img
                    src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
                    draggable="false"
                    alt="logo"
                    :style="styles['logo-img']"
                />
                <span :style="styles['logo-span']">Ant Design X Vue</span>
            </div>

            <Button type="link" :style="styles.addBtn" @click="onNewConversation">
                <PlusOutlined />
                New Conversation
            </Button>

            <Conversations
                :items="conversationsItems"
                :style="styles.conversations"
                :active-key="activeKey"
                @active-change="onSwitchConversation"
            />
        </div>

        <div :style="styles.chat">
            <Bubble.List :items="bubbleListItems" :roles="chatRoles" :style="styles.messages" />

            <Sender
                :value="content"
                :style="styles.sender"
                :loading="agentRequestLoading"
                @submit="onSubmitMessage"
                @change="value => (content = value)"
            >
                <template #prefix>
                    <Badge :dot="attachedFiles.length > 0 && !headerOpen">
                        <Button type="text" @click="() => (headerOpen = !headerOpen)">
                            <template #icon><PaperClipOutlined /></template>
                        </Button>
                    </Badge>
                </template>

                <template #header>
                    <Sender.Header
                        title="Attachments"
                        :open="headerOpen"
                        :styles="{ content: { padding: 0 } }"
                        @open-change="open => (headerOpen = open)"
                    >
                        <Attachments
                            :before-upload="() => false"
                            :items="attachedFiles"
                            @change="handleFileChange"
                        >
                            <template #placeholder="type">
                                <Flex
                                    v-if="type && type.type === 'inline'"
                                    align="center"
                                    justify="center"
                                    vertical
                                    gap="2"
                                >
                                    <Typography.Text style="font-size: 30px; line-height: 1">
                                        <CloudUploadOutlined />
                                    </Typography.Text>
                                    <Typography.Title
                                        :level="5"
                                        style="margin: 0; font-size: 14px; line-height: 1.5"
                                    >
                                        Upload files
                                    </Typography.Title>
                                    <Typography.Text type="secondary">
                                        Click or drag files to this area to upload
                                    </Typography.Text>
                                </Flex>
                                <Typography.Text v-if="type && type.type === 'drop'">
                                    Drop file here
                                </Typography.Text>
                            </template>
                        </Attachments>
                    </Sender.Header>
                </template>
            </Sender>
        </div>
    </div>
</template>
