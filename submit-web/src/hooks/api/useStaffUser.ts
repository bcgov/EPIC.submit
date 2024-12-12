import { useMutation, useQuery } from "@tanstack/react-query";
import { OnErrorType, OnSuccessType, submitRequest } from "@/utils/axiosUtils";
import { User } from "@/models/User";
import { QUERY_KEY } from "./constants";

const fetchStaffUserByGUID = (id: number) => {
  return submitRequest({ url: `/staff_user/${id}` });
};

const addStaffUser = (user: Omit<User, "id">) => {
  return submitRequest({ url: "/staff_user", method: "post", data: user });
};

export const useStaffUserById = (userId: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, userId],
    queryFn: () => fetchStaffUserByGUID(userId),
    enabled: !!userId,
  });
};

export const useStaffAddUser = (
  onSuccess: OnSuccessType,
  onError: OnErrorType,
) => {
  return useMutation({
    mutationFn: addStaffUser,
    onSuccess,
    onError,
  });
};
