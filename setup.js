const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check and install missing modules
const checkAndInstallModules = () => {
  const requiredModules = ['imagekit', 'multer'];
  
  requiredModules.forEach(module => {
    try {
      require.resolve(module);
      console.log(`✅ ${module} is already installed`);
    } catch (e) {
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
    }
  });
};

// Run the check
checkAndInstallModules();

console.log("Setup complete. Ensure any missing dependencies are installed before restarting the server.");
