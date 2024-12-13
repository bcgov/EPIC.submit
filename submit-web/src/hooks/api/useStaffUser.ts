import { useMutation, useQuery } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { STAFF_QUERY_KEY } from "./constants";
import { Options } from "./types";

type CreateStaffRequest = {
  first_name?: string;
  last_name?: string;
  work_email_address?: string;
  auth_guid?: string;
};

const fetchStaffUserByGUID = (id?: string) => {
  return submitRequest({ url: `staff/staff-user/${id}` });
};

const addStaffUser = (data: CreateStaffRequest) => {
  return submitRequest({ url: "staff/staff-user", method: "post", data });
};

export const useStaffUserById = (userId?: string) => {
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
