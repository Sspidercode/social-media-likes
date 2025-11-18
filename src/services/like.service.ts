import { AxiosError } from "axios";
import instance from "./index";

type LikeStateResponse = {
  likesCount: number;
  liked: boolean;
};

type ToggleLikeResponse = {
  likesCount: number;
  liked: boolean;
};

type ServiceResult<T> = {
  success: boolean;
  data?: T;
  status?: number;
  message?: string;
};

export const getLikeStateService = async (
  postId: string
): Promise<ServiceResult<LikeStateResponse>> => {
  try {
    const { data } = await instance.get<LikeStateResponse>("/likes", {
      params: { postId },
    });

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message,
      };
    }
    return {
      success: false,
      message: "Something went wrong",
    };
  }
};

export const toggleLikeService = async (
  postId: string
): Promise<ServiceResult<ToggleLikeResponse>> => {
  try {
    const { data } = await instance.post<ToggleLikeResponse>("/likes", { postId });

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message,
      };
    }
    return {
      success: false,
      message: "Something went wrong",
    };
  }
};


