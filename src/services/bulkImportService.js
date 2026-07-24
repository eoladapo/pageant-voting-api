import csv from 'csv-parser';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';

/**
 * Parse CSV buffer
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Parse Excel buffer
 */
const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

/**
 * Validate and normalize user data
 */
const validateUserData = (row, index) => {
  const errors = [];

  if (!row.name || !row.name.trim()) {
    errors.push(`Row ${index + 1}: Name is required`);
  }

  if (!row.email || !row.email.trim()) {
    errors.push(`Row ${index + 1}: Email is required`);
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(row.email)) {
    errors.push(`Row ${index + 1}: Invalid email format`);
  }

  if (!row.phone || !row.phone.trim()) {
    errors.push(`Row ${index + 1}: Phone is required`);
  }

  if (row.category && !['Miss', 'Mister', 'Teen'].includes(row.category)) {
    errors.push(`Row ${index + 1}: Category must be Miss, Mister, or Teen`);
  }

  if (row.age) {
    const age = parseInt(row.age);
    if (isNaN(age) || age < 16 || age > 100) {
      errors.push(`Row ${index + 1}: Age must be between 16 and 100`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: row.name?.trim(),
      email: row.email?.trim().toLowerCase(),
      phone: row.phone?.trim(),
      age: row.age ? parseInt(row.age) : undefined,
      category: row.category?.trim(),
      bio: row.bio?.trim(),
      photo: row.photo_url?.trim() || row.photo?.trim(),
      socialMedia: {
        instagram: row.instagram?.trim(),
        facebook: row.facebook?.trim(),
        twitter: row.twitter?.trim(),
        tiktok: row.tiktok?.trim(),
      },
    },
  };
};

/**
 * Bulk import users and optionally approve them as contestants
 */
export const bulkImportUsers = async (buffer, fileType, autoApprove = true) => {
  try {
    // Parse file
    let rows;
    if (fileType === 'csv') {
      rows = await parseCSV(buffer);
    } else {
      rows = parseExcel(buffer);
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: 'File is empty or invalid',
      };
    }

    const results = {
      total: rows.length,
      successful: [],
      failed: [],
      duplicates: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateUserData(row, i);

      if (!validation.isValid) {
        results.failed.push({
          row: i + 1,
          email: row.email,
          errors: validation.errors,
        });
        continue;
      }

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: validation.data.email });
        if (existingUser) {
          results.duplicates.push({
            row: i + 1,
            email: validation.data.email,
            message: 'User already exists',
          });
          continue;
        }

        // Create user
        const userData = {
          ...validation.data,
          paymentStatus: 'not_required',
          contestantStatus: autoApprove ? 'approved' : 'pending',
          approvedAt: autoApprove ? new Date() : null,
        };

        const user = await User.create(userData);

        // If auto-approve, create candidate
        if (autoApprove) {
          await Candidate.create({
            userId: user._id,
            name: user.name,
            age: user.age || 18,
            photo: user.photo || 'https://via.placeholder.com/400',
            bio: user.bio || '',
            category: user.category || 'Miss',
            socialMedia: user.socialMedia,
            votes: 0,
            isActive: true,
          });
        }

        results.successful.push({
          row: i + 1,
          email: validation.data.email,
          name: validation.data.name,
          approved: autoApprove,
        });
      } catch (error) {
        results.failed.push({
          row: i + 1,
          email: validation.data.email,
          errors: [error.message],
        });
      }
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Bulk import error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
