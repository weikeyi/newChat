import { jwtDecode } from 'jwt-decode'

export default function getUserId(){
    const token = localStorage.getItem('token')!
    const payload: {userId:number} = jwtDecode(token)
    const userId = payload.userId
    return userId
}