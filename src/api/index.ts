import axios from 'axios';
import { CreateUserDto, loginDto, ResponceUser } from '../types/types';


const instance = axios.create({
  baseURL: 'http://localhost:5001/api/',
});

export const userApi = {
  async register(dto: CreateUserDto): Promise<ResponceUser> {
    const { data } = await instance.post<CreateUserDto, { data: ResponceUser }>(
      'user/registration',
      dto,
    );
    return data;
  },

  async login(dto: loginDto): Promise<ResponceUser> {
    const { data } = await instance.post<loginDto, { data: ResponceUser }>('user/login', dto);
    return data;
  },
  
  async getMe(token:string) {
    const {data} = await instance.get<ResponceUser>('user/auth', {
      headers: { 'Authorization': 'Bearer ' + token}
    })
    return data;
  }
};
