<script setup lang="ts">
    import type {
        AttachmentsProps,
        BubbleListProps,
        BubbleProps,
        ConversationsProps,
    } from 'ant-design-x-vue'

    import { CloudUploadOutlined, PaperClipOutlined, PlusOutlined } from '@ant-design/icons-vue'
    import { Badge, Button, Flex, Typography, theme } from 'ant-design-vue'
    import {
        Attachments,
        Bubble,
        Conversations,
        Welcome,
        Sender,
        useXAgent,
        useXChat,
        XStream,
    } from 'ant-design-x-vue'
    import { computed, onMounted, ref, watch } from 'vue'
    import { h } from 'vue'
    import { UserOutlined } from '@ant-design/icons-vue'
    import { useChatStore } from '../stores/chat'
    import markdownit from 'markdown-it'
    import getUserId from '../until/getUserId'

    const md = markdownit({ html: true, breaks: true })
    //实现md
    const renderMarkdown: BubbleProps['messageRender'] = content =>
        h(Typography, null, {
            default: () => h('div', { innerHTML: md.render(content) }),
        })

    const { token } = theme.useToken()

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
            conversations: {
                padding: '0 12px',
                flex: 1,
                'overflow-y': 'auto',
            },
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
            messages: {
                flex: 1,
            },
            placeholder: {
                'padding-top': '32px',
                'text-align': 'left',
                flex: 1,
            },
            sender: {
                'box-shadow': token.value.boxShadow,
                'max-width': '700px',
                margin: '0 auto',
            },
            logo: {
                display: 'flex',
                height: '72px',
                'align-items': 'center',
                'justify-content': 'start',
                padding: '0 24px',
                'box-sizing': 'border-box',
            },
            'logo-img': {
                width: '24px',
                height: '24px',
                display: 'inline-block',
            },
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

    defineOptions({ name: 'PlaygroundIndependentSetup' })

    // const sleep = () => new Promise(resolve => setTimeout(resolve, 500))

    // function renderTitle(icon: VNode, title: string) {
    //   return h(Space, { align: 'start' }, [icon, h('span', title)])
    // }

    const placeholderNode = computed(() =>
        h(Welcome, {
            variant: 'borderless',
            icon: 'https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp', // 一张图标图片
            title: '欢迎来到这里！',
            description:
                '很高兴能与您相遇。无论您是想获取信息、解决问题，还是单纯想聊聊天，我都在这里陪伴您。请随时提出您的需求，我会尽最大努力为您提供帮助。让我们一起开启一段愉快的交流吧！😊',
            // extra: h(Space, {}, )
        })
    )

    const roles: BubbleListProps['roles'] = {
        ai: {
            placement: 'start',
            avatar: {
                icon: h(UserOutlined),
                style: {
                    color: '#f56a00',
                    backgroundColor: '#fde3cf',
                },
            },
            typing: { step: 5, interval: 20 },
            messageRender: renderMarkdown,
            styles: {
                content: {
                    borderRadius: '16px',
                },
            },
        },
        local: {
            placement: 'end',
            avatar: {
                icon: h(UserOutlined),
                style: {
                    color: '#fff',
                    backgroundColor: '#87d068',
                },
            },
            variant: 'shadow',
        },
    }

    // ==================== State ====================
    const chatStore = useChatStore()
    const currentUserId = ref<number | null>(null)

    const headerOpen = ref(false)
    const content = ref('')
    const conversationsItems = ref<ConversationsProps['items']>([])
    const activeKey = ref()
    const attachedFiles = ref<AttachmentsProps['items']>([])
    const agentRequestLoading = ref(false)

    // ==================== Runtime ====================
    const getHeader = () => {
        const token = localStorage.getItem('token')
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    }

    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onError, onUpdate }) => {
            try {
                const response = await fetch('http://localhost:3000/ai/chat', {
                    method: 'POST',
                    headers: getHeader(),
                    body: JSON.stringify({ content: message }),
                })

                // 用于拼接最终完整文本
                let reasoningText = ''
                let outputText = ''

                // 逐块读取 SSE 流
                for await (const chunk of XStream({
                    readableStream: response.body as ReadableStream<Uint8Array>,
                })) {
                    if (chunk.data == '[DONE]') {
                        const fullMarkdown = [
                            reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                            outputText,
                        ]
                            .filter(Boolean)
                            .join('\n\n')

                        onSuccess?.(fullMarkdown)
                        break
                    }

                    const raw = JSON.parse(chunk.data)
                    if (!raw) continue
                    try {
                        // 只需要解析一次
                        const parsedChunk = JSON.parse(chunk.data)
                        if (!parsedChunk) continue
                        const delta = parsedChunk.content
                        if (!delta) continue

                        if (parsedChunk.type === 'reasoning') {
                            reasoningText += delta
                        } else if (parsedChunk.type === 'output') {
                            outputText += delta
                        }

                        // 实时组合展示（optional）
                        const liveMarkdown = [
                            reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                            outputText,
                        ]
                            .filter(Boolean)
                            .join('\n\n')

                        onUpdate?.(liveMarkdown)
                    } catch (err) {
                        console.warn('JSON parse error: ', raw)
                    }
                }
            } catch (err: any) {
                console.error('[agent error]', err)
                onError?.(err.message || 'Server error')
            }
        },
    })

    const { onRequest, messages ,setMessages:setXChatMessages} = useXChat({
        agent: agent.value,
    })

    async function initializeUserSession() {
        try {
            currentUserId.value = getUserId()
            console.log('当前ID:' + currentUserId.value)
            await loadUserConversation()
            if (activeKey.value) {
                await loadMessagesForActiveConversation(activeKey.value)
            } else {
            }
        } catch (error: any) {
            console.error('初始化用户会话失败:', error.message)
            currentUserId.value = null
            conversationsItems.value = []
            setXChatMessages([]) // 清空 useXChat 的消息
            activeKey.value = undefined
            // authError.value = error.message || '身份认证失败，请检查登录状态。'
        }
    }
    async function loadUserConversation(){
        if(!currentUserId.value){
            return
        }
        try {
            const userConvs = await chatStore.getConversationListForCurrentUser()
            conversationsItems.value = userConvs
            console.log("加载的会话列表：",userConvs)

            if(userConvs.length>0){
                if (userConvs.length > 0) {
            // 检查当前 activeKey 是否在新的会话列表中有效
            const currentActiveKeyIsValid = userConvs.some(c => c.key === activeKey.value);
            if (!activeKey.value || !currentActiveKeyIsValid) {
                // 如果 activeKey 无效或未设置，则默认激活第一个会话
                activeKey.value = userConvs[0].key;
            }
            // 注意：activeKey 的变化会由其 watcher 处理，进而加载消息
        } else {
            // 如果用户没有会话
            activeKey.value = undefined;
        }
            }

        }catch{

        }
    }

    onMounted(()=>{
        initializeUserSession()
    })

// 新增或修改的 activeKey watcher
watch(activeKey, async (newActiveKey) => {
    console.log('activeKey 变化:', newActiveKey);
    if (newActiveKey !== undefined && currentUserId.value) {
        await loadMessagesForActiveConversation(newActiveKey);
    } else if (newActiveKey === undefined) {
        setXChatMessages([]); // 如果没有激活的会话，清空消息
    }
}, { immediate: true }); // immediate 确保初始 activeKey (如果存在) 的消息被加载

async function loadMessagesForActiveConversation(conversationIdToLoad: string) {
    if (!currentUserId.value) {
        console.warn("无法加载消息，当前用户ID未知。");
        setXChatMessages([]);
        return;
    }
    console.log(`为会话 ${conversationIdToLoad} 加载消息 (用户: ${currentUserId.value})`);
    try {
        const history = await chatStore.getMessages(Number(conversationIdToLoad)); // store action
        console.log('从store获取的历史消息:', history);
        setXChatMessages(history ? [...history] : []); // 更新 useXChat 的消息列表
    } catch (error: any) {
        console.error(`为会话 ${conversationIdToLoad} 加载消息失败:`, error.message);
        setXChatMessages([]);
    }
}
    // watch(
    //     messages,
    //     () => {
    //         if (activeKey.value !== undefined) {
    //             chatStore.setMessages(activeKey.value, messages.value)
    //         }
    //     },
    //     { deep: true }
    // )

    // ==================== Event ====================
    function onSubmit(nextContent: string) {
        if (!nextContent) return
        onRequest(nextContent)
        content.value = ''
    }

    async function onAddConversation() {
    if (!currentUserId.value) {
        return;
    }
    try {
        const newConv = await chatStore.addNewConversationForCurUser(/* 可选的 customLabel */);
        console.log('Store中创建的新会话:', newConv);
        // 重新从 store 加载会话列表以包含新创建的会话
        await loadUserConversation();
        // 激活新创建的会话 (如果 loadUserConversations 没有自动激活它)
        if (newConv && newConv.key) {
             activeKey.value = newConv.key;
        }
    } catch (error: any) {
        console.error("添加新会话失败:", error.message);
    }
}

    const onConversationClick: ConversationsProps['onActiveChange'] = (newKey) => {
    if (activeKey.value !== newKey) {
        console.log('点击切换会话到:', newKey);
        activeKey.value = newKey; // activeKey 的 watcher 将处理消息加载
    }
};

    const handleFileChange: AttachmentsProps['onChange'] = info =>
        (attachedFiles.value = info.fileList)

    const items = computed<BubbleListProps['items']>(() => {
        if (messages.value.length === 0) {
            return [{ content: placeholderNode, variant: 'borderless' }]
        }
        return messages.value.map(({ id, message, status }) => ({
            key: id,
            role: status === 'local' ? 'local' : 'ai',
            content: message,
        }))
    })
</script>

<template>
    <div :style="styles.layout">
        <div :style="styles.menu">
            <!-- 🌟 Logo -->
            <div :style="styles.logo">
                <img
                    src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
                    draggable="false"
                    alt="logo"
                    :style="styles['logo-img']"
                />
                <span :style="styles['logo-span']">Ant Design X Vue</span>
            </div>

            <!-- 🌟 添加会话 -->
            <Button type="link" :style="styles.addBtn" @click="onAddConversation">
                <PlusOutlined />
                New Conversation
            </Button>

            <!-- 🌟 会话管理 -->
            <Conversations
                :items="curUserConversation"
                :style="styles.conversations"
                :active-key="activeKey"
                @active-change="onConversationClick"
            />
        </div>

        <div :style="styles.chat">
            <!-- 🌟 消息列表 -->
            <Bubble.List :items="items" :roles="roles" :style="styles.messages" />

            <Sender
                :value="content"
                :style="styles.sender"
                :loading="agentRequestLoading"
                @submit="onSubmit"
                @change="value => (content = value)"
            >
                <template #prefix>
                    <Badge :dot="attachedFiles.length > 0 && !headerOpen">
                        <Button type="text" @click="() => (headerOpen = !headerOpen)">
                            <template #icon>
                                <PaperClipOutlined />
                            </template>
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
