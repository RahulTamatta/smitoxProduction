/**
 * Prepare script that handles development vs production environments
 */

// Only run husky install in development environments
if (process.env.NODE_ENV !== 'production') {
  try {
    const { execSync } = require('child_process');
    
    // Check if husky is available in node_modules
    try {
      require.resolve('husky');
      console.log('Setting up git hooks with Husky...');
      execSync('husky install', { stdio: 'inherit' });
    } catch (error) {
      console.log('Husky not found, skipping git hooks setup.');
    }
  } catch (error) {
    console.error('Error during prepare script:', error);
  }
} else {
  console.log('Production environment detected, skipping development setup steps.');
}
