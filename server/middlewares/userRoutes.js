const express = require('express');
const router = express.Router();
const Person = require('../models/person');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

// POST route to add a person
// Helper function to format phone number
const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Ensure it starts with the country code (assuming India +91)
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
};

// POST route to initiate signup
router.post('/signup', async (req, res) => {
    try {
        const data = req.body;
        console.log('Received signup data:', data);

        // Check if user already exists
        const existingUser = await Person.findOne({ username: data.username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Format phone number
        const phoneNumber = formatPhoneNumber(data.phone);
        console.log('Formatted phone number:', phoneNumber);

        // Log the API key (be careful with this in production)
        console.log('Using API Key:', API_KEY);

        // Send OTP
        const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/AUTOGEN`;
        console.log('Sending request to:', url);

        const response = await axios.get(url, {
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Resolve for any status code less than 500
            }
        });

        console.log('2Factor API Response:', response.data);
        
        if (response.data.Status === "Success") {
            // Store user data and session ID temporarily
            req.session.pendingUser = data;
            req.session.otpSessionId = response.data.Details;
            
            res.status(200).json({ message: 'OTP sent successfully. Please verify to complete signup.' });
        } else {
            console.error('2Factor API Error:', response.data);
            res.status(400).json({ error: 'Failed to send OTP', details: response.data });
        }
    } catch (err) {
        console.error('Error in signup route:', err);
        if (err.response) {
            console.error('2Factor API Error Data:', err.response.data);
            console.error('2Factor API Error Status:', err.response.status);
            console.error('2Factor API Error Headers:', err.response.headers);
            res.status(err.response.status).json({ error: 'Error in sending OTP', details: err.response.data });
        } else if (err.request) {
            console.error('No response received:', err.request);
            res.status(500).json({ error: 'No response received from OTP service' });
        } else {
            console.error('Error', err.message);
            res.status(500).json({ error: 'Error in setting up OTP request' });
        }
    }
});

// Login Route
router.post('/login', async(req, res) => {
    try{
        // Extract username and password from request body
        const {username, password} = req.body;

        // Find the user by username
        const user = await Person.findOne({username: username});

        // If user does not exist or password does not match, return error
        if( !user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid username or password'});
        }

        // generate Token 
        const payload = {
            id: user.id,
            username: user.username
        }
        const token = generateToken(payload);

        // resturn token as response
        res.json({token})
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Profile route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try{
        const userData = req.user;
        console.log("User Data: ", userData);

        const userId = userData.id;
        const user = await Person.findById(userId);

        res.status(200).json({user});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// GET method to get the person
router.get('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        const data = await Person.find();
        console.log('data fetched');
        res.status(200).json(data);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/:workType', async(req, res)=>{
    try{
        const workType = req.params.workType; // // Extract the work type from the URL parameter
        if(workType == 'chef' || workType == 'manager' || workType == 'waiter' ){
            const response = await Person.find({work: workType});
            console.log('response fetched');
            res.status(200).json(response);
        }else{
            res.status(404).json({error: 'Invalid work type'});
        }
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:id', async (req, res)=>{
    try{
        const personId = req.params.id; // Extract the id from the URL parameter
        const updatedPersonData = req.body; // Updated data for the person

        const response = await Person.findByIdAndUpdate(personId, updatedPersonData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Person not found' });
        }

        console.log('data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const personId = req.params.id; // Extract the person's ID from the URL parameter
        
        // Assuming you have a Person model
        const response = await Person.findByIdAndRemove(personId);
        if (!response) {
            return res.status(404).json({ error: 'Person not found' });
        }
        console.log('data delete');
        res.status(200).json({message: 'person Deleted Successfully'});
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


module.exports = router;