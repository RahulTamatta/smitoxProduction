import mongoose from "mongoose";
import xlsx from "xlsx";
import Pincode from "./models/pincodeModel.js";

const uri = "mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox";

mongoose.set('strictQuery', false);

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

mongoose.connect(uri, connectOptions)
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

async function uploadPincodes() {
  try {
    // Read Excel file
    const workbook = xlsx.readFile('pincode.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Log first few rows to inspect structure
    console.log('First few rows from Excel:', data.slice(0, 3));

    // Extract pincodes with validation
    const pincodes = data.map((row, index) => {
      // Find the correct property name that contains the pincode
      const pincodeValue = Object.values(row).find(val => 
        val && typeof val === 'number' && val.toString().length === 6
      );

      if (!pincodeValue) {
        console.log(`Warning: No valid pincode found in row ${index + 1}:`, row);
        return null;
      }

      return {
        code: pincodeValue.toString(),
        // Add other fields if they exist in your Excel
        state: row.state || row.State,
        city: row.city || row.City,
        landmark: row.landmark || row.Landmark
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Found ${pincodes.length} valid pincodes in the Excel file.`);

    if (pincodes.length === 0) {
      throw new Error('No valid pincodes found in the Excel file');
    }

    // Insert into MongoDB (skip duplicates)
    const result = await Pincode.insertMany(pincodes, { 
      ordered: false,
      // Skip duplicate key errors
      ordered: false
    }).catch(err => {
      // Handle bulk write errors
      if (err.writeErrors) {
        console.log(`Skipped ${err.writeErrors.length} duplicates.`);
        return err.insertedDocs;
      }
      throw err;
    });

    console.log(`Successfully processed ${result.length} pincodes.`);

  } catch (error) {
    console.error('Error uploading pincodes:', error);
  } finally {
    await mongoose.connection.close();
  }
}

uploadPincodes();