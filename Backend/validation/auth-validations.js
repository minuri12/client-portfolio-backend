import validator from "validator";

export const validateUserRegistration = (data) => {
    const errors = [];
    const name = String(data.name || data.username || data.fullName || data.full_name || "").trim();
    const email = String(data.email || data.userEmail || data.emailAddress || "").trim();
    const password = String(data.password || "").trim();

    // User name validation
    if (!name || validator.isEmpty(name)) {
      errors.push("Name is required");
    }

    // User email validation
    if (!email || validator.isEmpty(email)) {
        errors.push("Email is required");
    } else {
        if (!validator.isEmail(email)) {
            errors.push("Email is not valid");
        }
        if (email.length > 100) {
            errors.push("Email is too long");
        }
    }

    // Password validation
    if (!password || validator.isEmpty(password)) {
        errors.push("Password is required");
    } else {
        if (!validator.isLength(password, { min: 6, max: 128 })) {
            errors.push("Password must be between 6 and 128 characters");
        }
    }

    return errors;
};

export const validateUserLogin = (data) => {
    const errors = [];

    // User email validation
    if (!data.email || validator.isEmpty(String(data.email))) {
        errors.push("Email is required");
    } else {
        if (!validator.isEmail(data.email)) {
            errors.push("Email is not valid");
        }
        if (data.email.length > 100) {
            errors.push("Email is too long");
        }
    }

    // Password validation
    if (data.password === undefined || data.password === null || validator.isEmpty(String(data.password))) {
        errors.push("Password is required");
    } else {
        const password = String(data.password);
        if (!validator.isLength(password, { min: 6, max: 128 })) {
            errors.push("Password must be between 6 and 128 characters");
        }
    }

    return errors;
};

