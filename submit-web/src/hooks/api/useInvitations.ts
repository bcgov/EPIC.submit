import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";
import { submitRequest } from "@/utils/axiosUtils";

export const useCreateInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: createInvitation,
    ...options,
  });
};

const createInvitation = ({
  account_id,
  proponent_id,
  project_ids,
  package_id,
  email,
  role_id,
}: {
  account_id: number;
  proponent_id: number;
  role_id: string;
  email: string;
  project_ids: number[];
  package_id: number;
}) => {
  return submitRequest({
    url: `/invitations`,
    method: "post",
    data: {
      account_id,
      proponent_id,
      role_id,
      email,
      project_ids,
      package_id,
    },
  });
};
