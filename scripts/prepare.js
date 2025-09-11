/**
 * Prepare script that handles development vs production environments
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Only run husky install in development environments
if (process.env.NODE_ENV !== 'production') {
  try {
    // Check if husky is available in node_modules
    if (existsSync(join(process.cwd(), '.git'))) {
      console.log('Installing husky...');
      execSync('npx husky install', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error during prepare script:', error);
  }
} else {
  console.log('Production environment detected, skipping development setup steps.');
}
