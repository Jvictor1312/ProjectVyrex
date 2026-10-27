const internalRoles = new Set([
  "admin",
  "recruiter",
  "relationship_manager",
  "validator",
]);

export function dashboardPathForRoles(roles: readonly string[]) {
  return roles.some((role) => internalRoles.has(role))
    ? "/interno"
    : "/dashboard";
}
