const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateName = (name) => {
  return name && name.length >= 2;
};

const validateRole = (role) => {
  const validRoles = ['Student', 'Club Organizer', 'Admin'];
  return !role || validRoles.includes(role);
};

const validateDescription = (description) => {
  return !description || (typeof description === 'string' && description.length <= 500);
};

const validatePhoneNumber = (phoneNumber) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return phoneNumber && re.test(phoneNumber);
};

const validateRegistration = (body) => {
  const errors = [];
  if (!validateName(body.name)) errors.push('Name must be at least 2 characters');
  if (!validateEmail(body.email)) errors.push('Invalid email format');
  if (!validatePassword(body.password)) errors.push('Password must be at least 6 characters');
  if (!validateRole(body.role)) errors.push('Invalid role');
  if (!validateDescription(body.description)) errors.push('Description cannot exceed 500 characters');
  return errors;
};

const validateLogin = (body) => {
  const errors = [];
  if (!validateEmail(body.email)) errors.push('Invalid email format');
  if (!validatePassword(body.password)) errors.push('Password must be at least 6 characters');
  return errors;
};

const validateProfileUpdate = (body) => {
  const errors = [];
  if (body.name && !validateName(body.name)) errors.push('Name must be at least 2 characters');
  if (body.description && !validateDescription(body.description)) errors.push('Description cannot exceed 500 characters');
  return errors;
};

const validateBankDetails = (body) => {
  const errors = [];
  if (!validatePhoneNumber(body.phoneNumber)) errors.push('Invalid phone number format');
  return errors;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateRole,
  validateDescription,
  validatePhoneNumber,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateBankDetails,
};