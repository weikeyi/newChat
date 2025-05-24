// src/composables/useChatManager.ts
import { ref, watch, type Ref as VueRef  } from 'vue'
// import type { Ref } from 'vue'
import type { ConversationsProps, BubbleListProps } from 'ant-design-x-vue'
import { useChatStore } from '../stores/chat' // 根据需要调整路径
import getUserId from '../utils/getUserId' // 根据需要调整路径
import type {ConversationMessage} from '../type/index' // 根据需要调整路径

// 为 useXChat 的 setMessages 函数定义消息类型
type XChatMessage = {
    id: string | number
    message: string
    status: 'local' | 'loading' | 'success' | 'error'
    [key: string]: any
}
type SetXChatMessagesFn = (messages: XChatMessage[]) => void
type UIMessagesRef = VueRef<ConversationMessage>

export function useChatManager(setXChatMessages: SetXChatMessagesFn,chatMessageFromX:UIMessagesRef ) {
    const chatStore = useChatStore()
    const currentUserId = ref<number | null>(null)
    const conversationsItems = ref<ConversationsProps['items']>([])
    const activeKey = ref<string | undefined>()

    const mapUIMessageToStoreMessage = (uiMsg: XChatMessage): XChatMessage => {
        // console.log('映射消息:', uiMsg);
        
        let storeStatus: XChatMessage['status'] = 'loading';
        if ( uiMsg.status === 'local') {
            storeStatus = 'local';
        } else if (uiMsg.role === 'ai') {
            if (/* ant-x-vue success status */ uiMsg.status === 'success') {
                storeStatus = 'success';
            } else if (uiMsg.status === 'error') {
                storeStatus = 'error';
            } else if (!uiMsg.status && uiMsg.message) {
                 storeStatus = 'success';
            }
        }
        return {
            id: uiMsg.id,
            message: uiMsg.message,
            status: storeStatus,
            role: uiMsg.role === 'user' ? 'user' : 'ai',
            createdAt: (uiMsg as any).createdAt || Date.now(),
        };
    };

    // 监听Xchat的消息变化
    watch(
        chatMessageFromX,
        (newMessages, oldMessages) => {
            // console.log('XChat消息变化:', newMessages)
            // 仅当新消息与旧消息不同时才更新
            // console.log(`深度监听到消息变化，对话ID: ${activeKey.value}。准备保存...`);

            if (activeKey.value !== undefined) {
                const messagesToStore: XChatMessage[] = newMessages.map(mapUIMessageToStoreMessage);
                // 确保 activeKey.value 的类型与 store action 期望的 ConversationId 一致
                chatStore.setMessages(Number(activeKey.value), messagesToStore);
            }
        },
        { deep: true } // 初始加载时不立即调用
    )
    // 为当前激活的对话加载消息
    const loadMessagesForActiveConversation = async (conversationIdToLoad: string) => {
        if (!currentUserId.value) {
            console.warn('无法加载消息：当前用户ID未知。')
            setXChatMessages([])
            return
        }
        // console.log(`为对话 ${conversationIdToLoad} 加载消息 (用户: ${currentUserId.value})`)
        try {
            const history = await chatStore.getMessages(Number(conversationIdToLoad)) // 从 store 获取历史消息
            // console.log('从store获取的历史消息:', history)
            setXChatMessages(history ? [...history] : []) // 更新 useXChat 的消息列表
        } catch (error: any) {
            // console.error(`为对话 ${conversationIdToLoad} 加载消息失败:`, error.message)
            setXChatMessages([])
        }
    }

    // 加载用户的对话列表
    const loadUserConversations = async () => {
        if (!currentUserId.value) return
        try {
            const userConvs = await chatStore.getConversationListForCurrentUser(currentUserId.value)
            conversationsItems.value = userConvs
            // console.log('加载的对话列表：', userConvs)

            if (userConvs.length > 0) {
                // 检查当前 activeKey 是否在新的对话列表中有效
                const currentActiveKeyIsValid = userConvs.some(
                    c => String(c.key) === String(activeKey.value)
                )
                if (!activeKey.value || !currentActiveKeyIsValid) {
                    activeKey.value = String(userConvs[0].key) // 如果 activeKey 无效或未设置，则默认激活第一个对话
                }
                // 注意：activeKey 的变化会由其 watcher 处理，进而加载消息
            } else {
                // 如果用户没有对话
                activeKey.value = undefined
                setXChatMessages([]) // 没有对话，清空消息
            }
        } catch (error: any) {
            // console.error('加载用户对话列表失败:', error.message)
            conversationsItems.value = []
            activeKey.value = undefined
            setXChatMessages([])
        }
    }

    // 初始化用户会话
    const initializeUserSession = async () => {
        try {
            const userId = getUserId() // 假设此函数可能抛出错误或返回 null
            if (userId === null) throw new Error('无法确定用户ID。')
            currentUserId.value = userId
            // console.log('当前用户ID:' + currentUserId.value)
            await loadUserConversations()
            // 活动对话的消息将由 activeKey 侦听器加载
        } catch (error: any) {
            console.error('初始化用户会话失败:', error.message)
            currentUserId.value = null
            conversationsItems.value = []
            setXChatMessages([])
            activeKey.value = undefined
            // 可以在此处设置身份验证错误状态以显示给用户
        }
    }

    // 侦听 activeKey 的变化以加载消息
    watch(
        activeKey,
        async (newActiveKey, oldActiveKey) => {
            // console.log('activeKey 变化:', newActiveKey)
            // 仅当 newActiveKey 有效且与旧值不同时才加载
            if (newActiveKey !== undefined && newActiveKey !== oldActiveKey) {
                await loadMessagesForActiveConversation(String(newActiveKey))
            } else if (newActiveKey === undefined) {
                console.log('没有激活的会话，清空消息。');
                setXChatMessages([]) // 如果没有激活的会话，清空消息
            }
        },
        { immediate: false }
    ) // 如果初始加载由 initializeUserSession 设置 activeKey 处理，则将 immediate 设置为 false

    // 处理添加新对话的逻辑
    const handleAddConversation = async () => {
        if (!currentUserId.value) {
            console.warn('无法添加对话：用户ID未知。')
            return
        }
        try {
            const newConv = await chatStore.addNewConversationForCurUser()
            // console.log('Store中创建的新对话:', newConv)
            await loadUserConversations() // 重新加载以获取新的列表
            // 激活新创建的对话
            if (newConv && newConv.key) {
                activeKey.value = String(newConv.key)
            }
        } catch (error: any) {
            console.error('添加新对话失败:', error.message)
        }
    }

    // 处理对话点击事件的逻辑
    const handleConversationClick: ConversationsProps['onActiveChange'] = newKey => {
        if (activeKey.value !== newKey && newKey !== undefined) {
            // console.log('点击切换会话到:', newKey)
            activeKey.value = String(newKey) // activeKey 的 watcher 将处理消息加载
        }
    }

    return {
        currentUserId,
        conversationsItems,
        activeKey,
        initializeUserSession,
        handleAddConversation,
        handleConversationClick,
        loadUserConversations, // 如果外部需要，则暴露此函数
    }
}
