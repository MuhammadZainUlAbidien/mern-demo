const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Password Encryption
const registerUser = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
};

// 2. JWT Token Badge Generation
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, 'SECRET_KEY_123', { expiresIn: '1h' });
};

// Test Auth Functions
async function testAuth() {
    const securePassword = await registerUser("myPassword123");
    console.log("Encrypted Password Hash:", securePassword);

    const token = generateToken("USER_DB_ID_990");
    console.log("Generated JWT Token Badge:", token);
}

testAuth();