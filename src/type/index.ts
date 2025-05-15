import type { MessageInfo } from "ant-design-x-vue"

//用户ID的类型
export type UserId = number

//会话ID的类型
export type ConversationId = number

//单条聊天消息的类型
export type chatMessage = MessageInfo<string>

//单个会话中的消息数组
export type ConversationMessage = chatMessage[]

//单个用户的对话记录
export type UserConversations = Record<ConversationId,ConversationMessage>

//所有用户的对话记录
export type StoreConversationMap = Record<UserId,UserConversations>

//会话列表项的类型
export interface ConversationListItem {
    key:ConversationId,
    label:string
}