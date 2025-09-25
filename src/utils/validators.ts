/**
 * @fileoverview This file contains utility functions for validating user input.
 * It demonstrates the use of custom error classes and type guards to handle
 * validation errors effectively.
 * @note This code is taken from Monde Sineke
 * @author Your Name
 */

import { ValidationError } from '../types';

function registerUser(username: string, password: string) {
  if (username.length < 3) {
    throw new ValidationError(
      'Username must be at least three characters long.'
    );
  }

  if (password.length < 8) {
    throw new ValidationError(
      'Password must be at least eight characters long.'
    );
  }

  console.info('User registered successfully.');
}

try {
  registerUser('my', 'mypassword123');
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    alert((error as ValidationError).message);
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    alert(
      `An unexpected error occurred: ${(error as { message?: string }).message}`
    );
  } else {
    alert('An unexpected error occurred.');
  }
}
