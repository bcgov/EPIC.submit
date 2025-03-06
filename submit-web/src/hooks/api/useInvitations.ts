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
  accountId,
  proponentId,
  projectIds,
  packageId,
  email,
  roleId,
}: {
  accountId: number;
  proponentId: number;
  roleId: number;
  email: string;
  packageId: number;
  projectIds: number[];
}) => {
  return submitRequest({
    url: `/invitations`,
    method: "post",
    data: {
      account_id: accountId,
      proponent_id: proponentId,
      role_id: roleId,
      email: email,
      project_ids: projectIds,
      package_id: packageId,
    },
  });
};
