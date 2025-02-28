import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('Fixing dependencies and lock file sync issues...');

try {
  // Check if package-lock.json exists
  if (fs.existsSync('./package-lock.json')) {
    console.log('Backing up original package-lock.json...');
    fs.copyFileSync('./package-lock.json', './package-lock.json.backup');
  }

  // Use async/await with ES modules
  (async () => {
    try {
      // Run npm install to generate a fresh lock file
      console.log('Running npm install to regenerate lock file...');
      const { stdout: installOutput } = await execAsync('npm install');
      console.log(installOutput);
      
      // Run npm dedupe to optimize dependencies
      console.log('Running npm dedupe to optimize dependencies...');
      const { stdout: dedupeOutput } = await execAsync('npm dedupe');
      console.log(dedupeOutput);
      
      console.log('Dependencies fixed successfully!');
    } catch (error) {
      console.error('Error fixing dependencies:', error.message);
      
      // Try to restore backup if it exists
      if (fs.existsSync('./package-lock.json.backup')) {
        console.log('Restoring package-lock.json from backup...');
        fs.copyFileSync('./package-lock.json.backup', './package-lock.json');
      }
      
      process.exit(1);
    }
  })();
} catch (error) {
  console.error('Error in setup:', error.message);
  process.exit(1);
}
