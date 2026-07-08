import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useAccount } from "@/store/accountStore";
import { EPIC_SUBMIT_ROLE, EpicSubmitRole } from "@/models/Role";

export const useIsMobile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile;
};

// useMounted is a useEffect with empty dependencies array
export const useMounted = (callback: () => void) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, []);
};

/**
 * Hook to check if the current user has a specific role or full_access.
 * This encapsulates the common pattern of checking for a role OR full_access.
 * 
 * @param requiredRole - The specific role to check for (e.g., 'mp_create', 'w_edit')
 * @returns boolean - true if user has the required role OR full_access
 * 
 * @example
 * const hasCreatePermission = useHasRole(EPIC_SUBMIT_ROLE.mp_create);
 * const hasGISPermission = useHasRole(EPIC_SUBMIT_ROLE.gis_extended_edit);
 */
export const useHasRole = (requiredRole: EpicSubmitRole | string): boolean => {
  const { roles } = useAccount();
  
  return useMemo(() => {
    if (!roles) return false;
    return roles.includes(requiredRole) || roles.includes(EPIC_SUBMIT_ROLE.full_access);
  }, [roles, requiredRole]);
};

/**
 * Hook to check if the current user has ANY of the specified roles or full_access.
 * 
 * @param requiredRoles - Array of roles to check for
 * @returns boolean - true if user has any of the required roles OR full_access
 * 
 * @example
 * const hasAnyEditRole = useHasAnyRole([EPIC_SUBMIT_ROLE.mp_edit, EPIC_SUBMIT_ROLE.w_edit]);
 */
export const useHasAnyRole = (requiredRoles: (EpicSubmitRole | string)[]): boolean => {
  const { roles } = useAccount();
  
  return useMemo(() => {
    if (!roles) return false;
    if (roles.includes(EPIC_SUBMIT_ROLE.full_access)) return true;
    return requiredRoles.some(role => roles.includes(role));
  }, [roles, requiredRoles]);
};

/**
 * Hook to check if the current user has ALL of the specified roles or full_access.
 * 
 * @param requiredRoles - Array of roles to check for
 * @returns boolean - true if user has all of the required roles OR full_access
 * 
 * @example
 * const hasAllRoles = useHasAllRoles([EPIC_SUBMIT_ROLE.mp_view, EPIC_SUBMIT_ROLE.mp_edit]);
 */
export const useHasAllRoles = (requiredRoles: (EpicSubmitRole | string)[]): boolean => {
  const { roles } = useAccount();
  
  return useMemo(() => {
    if (!roles) return false;
    if (roles.includes(EPIC_SUBMIT_ROLE.full_access)) return true;
    return requiredRoles.every(role => roles.includes(role));
  }, [roles, requiredRoles]);
};
