import axios from 'axios'

const api = () => {

  let instance = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
  })

  // Set the AUTH token for any request
  //@ts-ignore
  instance.interceptors.request.use(function (config: { headers: { Authorization: string; }; }) {
    const token = window.localStorage.getItem('token')
    config.headers.Authorization =  token ? `Bearer ${token}` : ''
    return config
  });

  return instance
};

export default api()
