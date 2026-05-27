import { MongoClient } from 'mongodb';
import * as XLSX from 'xlsx';

const uri = "mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");

    // The user's screenshot indicates the database is 'test' and the collection is 'users'
    const db = client.db("test");
    const collection = db.collection("users");

    console.log("Fetching users...");
    // Retrieve all documents
    const users = await collection.find({}).toArray();

    if (users.length === 0) {
      console.log("No users found.");
      return;
    }

    console.log(`Found ${users.length} users. Processing data...`);

    // Process documents to ensure they are flat enough for Excel
    const formattedUsers = users.map(user => {
      const formatted = { ...user };
      
      // Convert ObjectId to string
      if (formatted._id) formatted._id = formatted._id.toString();
      
      // Convert arrays/objects to JSON strings to avoid [object Object] in Excel
      for (const key of Object.keys(formatted)) {
        if (typeof formatted[key] === 'object' && formatted[key] !== null) {
          if (formatted[key] instanceof Date) {
            formatted[key] = formatted[key].toISOString();
          } else {
            formatted[key] = JSON.stringify(formatted[key]);
          }
        }
      }
      return formatted;
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Write to file
    const outputFilename = "users_export.xlsx";
    XLSX.writeFile(workbook, outputFilename);
    console.log(`Extraction complete! Saved to ${outputFilename} in the current directory.`);

  } catch (err) {
    console.error("Error connecting to MongoDB or writing file:", err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
