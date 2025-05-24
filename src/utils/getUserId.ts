import { jwtDecode } from 'jwt-decode'

export default function getUserId(){
    const token = localStorage.getItem('token')!
    const payload: {useId:number} = jwtDecode(token)
    const userId = payload.useId
    // console.log(userId);
    
    return userId
}