
import { CAPABILITIES, ROLE_CAPABILITIES } from './config/rbac-policy.js';

console.log('--- CAPABILITIES KEYS ---');
console.log(Object.keys(CAPABILITIES));

console.log('--- SUPER_ADMIN CAPS ---');
console.log(ROLE_CAPABILITIES.super_admin);

console.log('--- HAS products:delete? ---');
console.log(ROLE_CAPABILITIES.super_admin.includes('products:delete'));
