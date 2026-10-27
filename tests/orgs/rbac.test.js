const { policies, roles, hasRole } = require('../../src/lib/organizationPolicies');

describe('organization role policies', () => {
  test('owners can manage members, events, and shifts', () => {
    const membership = { role: roles.owner };

    expect(hasRole(membership, policies.manageMembers)).toBe(true);
    expect(hasRole(membership, policies.manageEvents)).toBe(true);
    expect(hasRole(membership, policies.manageShifts)).toBe(true);
  });

  test('coordinators can manage members, events, and shifts', () => {
    const membership = { role: roles.coordinator };

    expect(hasRole(membership, policies.manageMembers)).toBe(true);
    expect(hasRole(membership, policies.manageEvents)).toBe(true);
    expect(hasRole(membership, policies.manageShifts)).toBe(true);
  });

  test('shift leads cannot manage organisation data', () => {
    const membership = { role: roles.shiftLead };

    expect(hasRole(membership, policies.manageMembers)).toBe(false);
    expect(hasRole(membership, policies.manageEvents)).toBe(false);
    expect(hasRole(membership, policies.manageShifts)).toBe(false);
  });

  test('missing memberships never pass a policy', () => {
    expect(hasRole(null, policies.manageEvents)).toBe(false);
  });
});
