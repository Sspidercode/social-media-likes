import { AxiosError } from 'axios'
import instance from './index'

export const loginService = async (userdata: { username: string, password: string }) => {
  try {
    const { data } = await instance.post('/auth/login', userdata)

    return {
      success: true,
      message: data?.message
    }
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message
      }
    }
    return {
      success: false,
      message: "Something went wrong"
    }
  }
}

export const registerService = async (userdata: { fullName: string, username: string, password: string }) => {
  try {
    console.log("Registering user:", userdata);
    const { data } = await instance.post('/auth/register', userdata)

    return {
      success: true,
      message: data?.message
    }
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message
      }
    }
    return {
      success: false,
      message: "Something went wrong"
    }
  }
}

export const logoutService = async () => {
  try {
    const { data } = await instance.post('/auth/logout')
    return {
      success: true,
      message: data?.message
    }
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message
      }
    }
    return {
      success: false,
      message: "Something went wrong"
    }
  }
}