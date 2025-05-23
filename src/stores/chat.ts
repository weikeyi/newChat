import { defineStore } from 'pinia'
import getUserId from '../utils/getUserId'
import type {  chatMessage, ConversationId, ConversationListItem, ConversationMessage, StoreConversationMap, UserId } from '../type'


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
  
      setMessages(convId: ConversationId, msgs: ConversationMessage) {
        const uid = getUserId()
        this._ensureUserChatMap(uid)
        this.conversationMap[uid][convId] = msgs
      },
  
      appendMessage(convId: ConversationId, msg: chatMessage) {
        const uid = getUserId()
        this._ensureUserChatMap(uid)
        const list = this.conversationMap[uid][convId] || []
        this.conversationMap[uid][convId] = [...list, msg]
      },
  
      getMessages(convId: ConversationId): ConversationMessage {
        const uid = getUserId()
        this._ensureUserChatMap(uid)
        return this.conversationMap[uid][convId] || []
      },
  
      deleteMessages(convId: ConversationId) {
        const uid = getUserId()
        this._ensureUserChatMap(uid)
        delete this.conversationMap[uid][convId]
      },
  
      getConversationListForCurrentUser(uid:number):ConversationListItem[] {
        this._ensureUserChatMap(uid)
        const convIds = Object.keys(this.conversationMap[uid])
        // 若无会话，则自动创建一个
        if (convIds.length === 0) {
          this.addNewConversationForCurUser('默认会话')
          return this.getConversationListForCurrentUser(uid)
        }
        return convIds.map(key => ({ key, label: `会话 ${key}` }))
      },
  
      addNewConversationForCurUser(customLabel?: string) {
        const uid = getUserId()
        this._ensureUserChatMap(uid)
        const key = Date.now()
        this.conversationMap[uid][key] = []
        return { key, label: customLabel || `新聊天 ${Object.keys(this.conversationMap[uid]).length}` }
      },
    },
    persist: {},
  })
  