import { useMutation, useQuery } from "@tanstack/react-query";
import { OnErrorType, OnSuccessType, submitRequest } from "@/utils/axiosUtils";
import { User } from "@/models/User";
import { QUERY_KEY } from "./constants";
import { Options } from "./types";

const fetchStaffUserByGUID = (id: number) => {
  return submitRequest({ url: `staff/staff_user/${id}` });
};

const addStaffUser = (user: User) => {
  return submitRequest({ url: "staff/staff_user", method: "post", data: user });
};

export const useStaffUserById = (userId: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, userId],
    queryFn: () => fetchStaffUserByGUID(userId),
    enabled: !!userId,
  });
};

export const useStaffAddUser = (options?: Options) => {
  return useMutation({
    mutationFn: addStaffUser,
    ...options,
  });
};
