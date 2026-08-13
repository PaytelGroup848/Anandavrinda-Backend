const ApiError = require('../utils/ApiError');

/**
 * Check if user has required permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return next();
      }

      // Sub-admin must have specific permission
      if (user.role === 'sub_admin') {
        if (user.permissions && user.permissions.includes(permission)) {
          return next();
        }
        
        // Check wildcard permission (e.g., 'categories_*')
        const permissionParts = permission.split('_');
        if (permissionParts.length > 1) {
          const wildcardPermission = `${permissionParts[0]}_*`;
          if (user.permissions && user.permissions.includes(wildcardPermission)) {
            return next();
          }
        }
        
        throw new ApiError(403, `Access denied. '${permission}' permission required.`);
      }

      throw new ApiError(403, 'Access denied.');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can view a resource
 */
const canView = (resource) => hasPermission(`${resource}_view`);

/**
 * Check if user can create a resource
 */
const canCreate = (resource) => hasPermission(`${resource}_create`);

/**
 * Check if user can edit a resource
 */
const canEdit = (resource) => hasPermission(`${resource}_edit`);

/**
 * Check if user can delete a resource
 */
const canDelete = (resource) => hasPermission(`${resource}_delete`);

module.exports = {
  hasPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
};