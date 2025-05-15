import { defineStore } from 'pinia'
import getUserId from '../until/getUserId'
import type {  chatMessage, ConversationId, ConversationMessage, StoreConversationMap, UserId } from '../type'


export const useChatStore = defineStore('chat', {
    state: () => ({
        conversationMap: {} as StoreConversationMap,
    }),
    actions: {
        _ensureUserChatMap(userId: UserId) {
            if (!this.conversationMap[userId]) {
                this.conversationMap[userId] = {}
            }
        },
        // setMessages(conversationId: ConversationId, messages:chatMessage) {
        //     const currentUserId = getUserId()
        //     this._ensureUserChatMap(currentUserId)
        //     this.conversationMap[getUserId()][conversationId] = messages
        // },
        setMessages(conversationId: ConversationId,messages:ConversationMessage){
            this.conversationMap[getUserId()][conversationId] = messages
        },
        getMessages(conversationId: ConversationId) {
            return this.conversationMap[getUserId()][conversationId]
        },
        deleteMessages(conversationId: ConversationId) {
            delete this.conversationMap[getUserId()][conversationId]
        },
        /**
         * 获取当前用户的会话列表。
         * 每个列表项应包含 key (conversationId) 和 label。
         */
        getConversationListForCurrentUser() {
            const userId = getUserId()
            if (this.conversationMap[userId]) {
                return Object.keys(this.conversationMap[userId]).map(convId => ({
                    key: convId,
                    label: `会话${convId}`,
                }))
            }
            return []
        },
        /**
         * 为当前用户添加一个新会话并返回该会话信息。
         * 新会话初始化时消息列表为空。
         */
        addNewConversationForCurUser(customLabel?: string) {
            const userId = getUserId()
            this._ensureUserChatMap(userId) // 确保用户的顶级记录存在

            // 生成一个相对唯一的会话 ID
            const newConversationId :ConversationId = Date.now()
            const label =
                customLabel || `新聊天 ${Object.keys(this.conversationMap[userId]).length + 1}`

            this.conversationMap[userId][newConversationId] = [] // 初始化为空消息列表

            return { key: newConversationId, label }
        },
    },
    persist: {},
})
