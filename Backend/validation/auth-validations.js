import validator from "validator";

export const validateUserRegistration = (data) => {
    const errors = [];

    // User name validation
    if (!data.name || validator.isEmpty(String(data.name))) {
      errors.push("Name is required");
    }

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
        // Must be numeric
        if (!validator.isNumeric(String(data.password))) {
          errors.push("Password must be numeric");
        } else {
          // Must have a max length of 4
          if (String(data.password).length > 4) {
            errors.push("Password cannot be longer than 4 digits");
          }
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
        // Must be numeric
        if (!validator.isNumeric(String(data.password))) {
          errors.push("Password must be numeric");
        } else {
          // Must have a max length of 4
          if (String(data.password).length > 4) {
            errors.push("Password cannot be longer than 4 digits");
          }
        }
    }

    return errors;
};

