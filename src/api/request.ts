import axios from "axios";

const request = axios.create({
    baseURL:import.meta.env.PROD
    ? 'http://120.53.5.138:3000' 
    : '/api',
    timeout:8000,
})
request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.log('请求失败',error);
        return Promise.reject(error)
    }
)
export default request as unknown as {
  get<T>(url: string, config?: any): Promise<T>;
  post<T>(url: string, data?: any, config?: any): Promise<T>;
  put<T>(url: string, data?: any, config?: any): Promise<T>;
  delete<T>(url: string, config?: any): Promise<T>;
};