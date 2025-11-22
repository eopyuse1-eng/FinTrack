/**
 * Authentication Utilities
 * Handles verification gates and authentication logic
 */

/**
 * Check if user can use local (email/password) login
 * Returns: { allowed: boolean, message: string }
 * 
 * Rules:
 * - If isEmailVerified = true → allowed
 * - If isEmailVerified = false → NOT allowed (must verify via Gmail first)
 * - Exception: Seeder Admin and Demo Seeds can use local login immediately
 */
exports.canUseLocalLogin = (user) => {
  if (!user) {
    return { allowed: false, message: 'User not found' };
  }

  // Demo users (created with isEmailVerified = true) can use local login
  if (user.isEmailVerified === true) {
    return { allowed: true, message: 'Local login allowed' };
  }

  // Users who haven't verified via Gmail cannot use local login
  return {
    allowed: false,
    message: 'Local login unavailable. Please verify your Gmail via "Sign in with Google" first.',
  };
};

/**
 * Check if user is a demo seed user
 * Demo seeds are created with isEmailVerified = true and can bypass OAuth
 */
exports.isDemoSeed = (user) => {
  if (!user) return false;
  
  // Demo seeds have isEmailVerified = true from creation
  // Check if email matches demo pattern
  const demoEmails = [
    'maria.santos@company.com',
    'juan.cruz@company.com',
    'joshua.marcelino@company.com',
    'lj.tanauan@company.com',
    'ana.garcia@company.com',
    'seeder@example.com',
  ];
  
  return demoEmails.includes(user.email);
};

/**
 * Check if user is Seeder Admin
 */
exports.isSeederAdmin = (user) => {
  if (!user) return false;
  return user.role === 'seeder_admin';
};

/**
 * Generate role-based creation rules
 * Returns which roles can create which roles
 */
exports.getCreationRules = () => {
  return {
    seeder_admin: ['supervisor'], // Seeder Admin creates Supervisors
    supervisor: ['hr_head'], // Supervisor creates HR Heads
    hr_head: ['hr_staff', 'employee'], // HR Head creates HR Staff and Employees
    hr_staff: [], // HR Staff cannot create users
    employee: [], // Employees cannot create users
  };
};

/**
 * Check if user can create another user
 */
exports.canCreateUser = (creatorRole, targetRole) => {
  const rules = exports.getCreationRules();
  
  if (!rules[creatorRole]) {
    return { allowed: false, message: `Role ${creatorRole} cannot create users` };
  }
  
  if (!rules[creatorRole].includes(targetRole)) {
    return { allowed: false, message: `${creatorRole} cannot create ${targetRole}` };
  }
  
  return { allowed: true, message: 'Creation allowed' };
};

/**
 * Get department assignment rules based on role
 */
exports.getDefaultDepartment = (role) => {
  const departmentMap = {
    seeder_admin: 'admin',
    supervisor: 'supervisor',
    hr_head: 'admin',
    hr_staff: 'hr',
    employee: 'marketing', // Default, can be changed
  };
  
  return departmentMap[role] || 'marketing';
};

module.exports = exports;
