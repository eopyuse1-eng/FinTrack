/**
 * Password Strength & Security Utilities
 * Validates passwords and enforces security requirements
 */

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 */
exports.validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const strength = {
    isValid: false,
    score: 0,
    errors: [],
    suggestions: [],
  };

  // Check length
  if (password.length < minLength) {
    strength.errors.push(`Password must be at least ${minLength} characters long`);
  } else {
    strength.score += 20;
  }

  // Check uppercase
  if (!hasUpperCase) {
    strength.errors.push('Password must contain at least 1 uppercase letter (A-Z)');
  } else {
    strength.score += 20;
  }

  // Check lowercase
  if (!hasLowerCase) {
    strength.errors.push('Password must contain at least 1 lowercase letter (a-z)');
  } else {
    strength.score += 20;
  }

  // Check numbers
  if (!hasNumbers) {
    strength.errors.push('Password must contain at least 1 number (0-9)');
  } else {
    strength.score += 20;
  }

  // Check special characters
  if (!hasSpecialChar) {
    strength.errors.push('Password must contain at least 1 special character (!@#$%^&*)');
  } else {
    strength.score += 20;
  }

  // Determine validity and strength level
  strength.isValid = strength.errors.length === 0;

  if (strength.score >= 100) {
    strength.level = 'STRONG';
  } else if (strength.score >= 60) {
    strength.level = 'MEDIUM';
  } else {
    strength.level = 'WEAK';
  }

  // Add suggestions
  if (!strength.isValid) {
    strength.suggestions = [
      'Example strong password: SecurePass@2025',
      'Recommended: Mix uppercase, lowercase, numbers, and special characters',
    ];
  }

  return strength;
};

/**
 * Generate a secure random password for new users
 * Format: RandomWord + Number + SpecialChar
 */
exports.generateSecurePassword = () => {
  const words = [
    'Phoenix', 'Dragon', 'Thunder', 'Falcon', 'Tiger',
    'Silver', 'Golden', 'Storm', 'Swift', 'Brave',
  ];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];
  const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];

  return `${randomWord}${randomNumber}${randomChar}`;
};

/**
 * Check if password was recently changed
 * Prevents immediate password reuse
 */
exports.isRecentPasswordChange = (lastPasswordChangeDate, minDaysRequired = 1) => {
  if (!lastPasswordChangeDate) return false;

  const now = new Date();
  const lastChange = new Date(lastPasswordChangeDate);
  const daysDiff = (now - lastChange) / (1000 * 60 * 60 * 24);

  return daysDiff < minDaysRequired;
};

/**
 * Validate Seeder Admin password (stricter than normal)
 * Seeder Admin MUST have a very strong password
 */
exports.validateSeederAdminPassword = (password) => {
  const strength = exports.validatePasswordStrength(password);

  // Seeder Admin has stricter requirements
  const additionalChecks = {
    isValid: strength.isValid && strength.score === 100,
    minLength: password.length >= 12, // 12 chars for Seeder Admin
    noCommonPatterns: !(/(.)\1{2,}/.test(password)), // No repeated characters (AAA, 111)
    noSequentialChars: !/(012|123|234|345|456|567|678|789|abc|bcd|cde)/.test(password), // No sequential patterns
  };

  const seederAdminValidation = {
    ...strength,
    isValid: Object.values(additionalChecks).every(v => v),
    errors: [
      ...strength.errors,
      !additionalChecks.minLength ? 'Seeder Admin password must be at least 12 characters' : null,
      !additionalChecks.noCommonPatterns ? 'Password cannot contain repeated characters (AAA, 111)' : null,
      !additionalChecks.noSequentialChars ? 'Password cannot contain sequential patterns (123, abc)' : null,
    ].filter(Boolean),
  };

  seederAdminValidation.level = seederAdminValidation.isValid ? 'VERY_STRONG' : 'INVALID';

  return seederAdminValidation;
};

module.exports = exports;
