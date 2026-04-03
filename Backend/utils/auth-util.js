import bcrypt from 'bcrypt';

const saltRounds = process.env.SALT || 10;

// Hash a user password before storing it.
export const hashPassword = async (password) => {
  if (!password && password !== 0) {
    throw new Error("Password is required for hashing.");
  }
  return await bcrypt.hash(String(password), saltRounds);
};

// Compares a plain text password with a hashed password.
export const comparePasswords = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(String(plainPassword), hashedPassword);
};


// Hash a refresh token before storing it in DB.
export const hashRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required for hashing.");
  }
  return await bcrypt.hash(refreshToken, saltRounds);
};

// Compares a plain text refresh token with its hashed version.
export const compareRefreshTokens = async (plainRefreshToken, hashedRefreshToken) => {
  return bcrypt.compare(String(plainRefreshToken), hashedRefreshToken);
};

// Generate random temporary password
export const generateTempPassword = () => {
  return Math.floor(1000 + Math.random() * 9000); // ensures 4-digit number
}


