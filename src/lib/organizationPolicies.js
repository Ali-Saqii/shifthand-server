const roles = Object.freeze({
  owner: 'owner',
  coordinator: 'coordinator',
  shiftLead: 'shift_lead'
});

const policies = Object.freeze({
  manageOrganization: [roles.owner],
  manageMembers: [roles.owner, roles.coordinator],
  manageEvents: [roles.owner, roles.coordinator],
  manageShifts: [roles.owner, roles.coordinator]
});

function hasRole(membership, allowedRoles) {
  return Boolean(membership && allowedRoles.includes(membership.role));
}

module.exports = { roles, policies, hasRole };
