import { useMutation, useQuery } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { User } from "@/models/User";
import { STAFF_QUERY_KEY } from "./constants";
import { Options } from "./types";

const fetchStaffUserByGUID = (id: number) => {
  return submitRequest({ url: `staff/staff-user/${id}` });
};

const addStaffUser = (user: User) => {
  return submitRequest({ url: "staff/staff-user", method: "post", data: user });
};

export const useStaffUserById = (userId: number) => {
  return useQuery({
    queryKey: [STAFF_QUERY_KEY.STAFF_USER, userId],
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
