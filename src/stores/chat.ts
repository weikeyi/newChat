import { defineStore } from "pinia"

import type { MessageInfo } from 'ant-design-x-vue'

type chatMessage = MessageInfo<string>


export const useChatStore = defineStore('chat', {
    state:()=>({
        conversationMap:{} as Record<string, chatMessage[]>
    }),
    actions:{
        setMessages(conversationId:string,messages:chatMessage[]){
            this.conversationMap[conversationId] = messages
        },
        getMessages(conversationId:string){
            return this.conversationMap[conversationId]
        },
        deleteMessages(conversationId:string){
            delete this.conversationMap[conversationId]
        }
    }
})