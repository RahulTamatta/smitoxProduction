import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Checking for required modules...');

// Function to check and install missing modules
const checkAndInstallModules = () => {
  const requiredModules = ['imagekit', 'multer'];
  
  requiredModules.forEach(module => {
    try {
      // Use dynamic import to check if module exists
      import(module)
        .then(() => {
          console.log(`✅ ${module} is already installed`);
        })
        .catch(() => {
          console.log(`⚠️ ${module} is not installed, installing now...`);
          
          exec(`npm install ${module}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error installing ${module}: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Installation warning for ${module}: ${stderr}`);
            }
            console.log(`✅ ${module} installed successfully: ${stdout}`);
          });
        });
    } catch (e) {
      console.log(`⚠️ Error checking ${module}: ${e.message}`);
    }
  });
};

// Run the check
checkAndInstallModules();

console.log("Setup complete. Ensure any missing dependencies are installed before restarting the server.");
