# Code to Win - Important Code Snippets

## 📋 Table of Contents
- [Authentication & Security](#authentication--security)
- [Database Operations](#database-operations)
- [Web Scraping](#web-scraping)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Utility Functions](#utility-functions)
- [Cron Jobs & Scheduling](#cron-jobs--scheduling)

## 🔐 Authentication & Security

### JWT Token Generation
```javascript
// utils/auth.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.user_id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Authentication Middleware
```javascript
// middleware/auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Password Hashing
```javascript
// utils/password.js
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

## 🗄️ Database Operations

### Database Connection Pool
```javascript
// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

module.exports = pool;
```

### User Registration Query
```javascript
// routes/authRoutes.js
const registerUser = async (userData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (user_id, email, password, role, name, dept, year, section) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userData.user_id, userData.email, userData.hashedPassword, 
       userData.role, userData.name, userData.dept, userData.year, userData.section]
    );
    
    // Insert student-specific data if role is student
    if (userData.role === 'student') {
      await connection.execute(
        `INSERT INTO student_performance (student_id, total_score, university_rank) 
         VALUES (?, 0, NULL)`,
        [userData.user_id]
      );
    }
    
    await connection.commit();
    return userResult;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
```

### Ranking Update Query
```javascript
// updateRankings.js
const updateUniversityRankings = async () => {
  const query = `
    UPDATE student_performance sp1
    JOIN (
      SELECT student_id, 
             ROW_NUMBER() OVER (ORDER BY total_score DESC, student_id ASC) as new_rank
      FROM student_performance 
      WHERE total_score > 0
    ) sp2 ON sp1.student_id = sp2.student_id
    SET sp1.university_rank = sp2.new_rank
  `;
  
  const [result] = await pool.execute(query);
  return result.affectedRows;
};
```

## 🕷️ Web Scraping

### LeetCode Scraper
```javascript
// scrapers/leetcodeScraper.js
const axios = require('axios');

const scrapeLeetCodeProfile = async (username) => {
  try {
    const graphqlQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
            }
          }
        }
      `,
      variables: { username }
    };

    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CodeToWin/1.0)'
      },
      timeout: 10000
    });

    const data = response.data.data.matchedUser;
    if (!data) throw new Error('User not found');

    const stats = data.submitStats.acSubmissionNum;
    return {
      easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
      medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
      hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
      ranking: data.profile.ranking || 0
    };

  } catch (error) {
    throw new Error(`LeetCode scraping failed: ${error.message}`);
  }
};
```

### CodeChef Scraper
```javascript
// scrapers/codechefScraper.js
const cheerio = require('cheerio');
const axios = require('axios');

const scrapeCodeChefProfile = async (username) => {
  try {
    const url = `https://www.codechef.com/users/${username}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CodeToWin/1.0)'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract star rating
    const starElement = $('.rating-number');
    const currentRating = parseInt(starElement.text()) || 0;
    
    // Extract problems solved
    const problemsElement = $('.problems-solved .content');
    const problemsSolved = parseInt(problemsElement.text()) || 0;
    
    // Extract contest participation
    const contestsElement = $('.contest-participated-count .content');
    const contestsParticipated = parseInt(contestsElement.text()) || 0;

    return {
      currentRating,
      problemsSolved,
      contestsParticipated,
      stars: Math.floor(currentRating / 200) // Approximate star calculation
    };

  } catch (error) {
    throw new Error(`CodeChef scraping failed: ${error.message}`);
  }
};
```

### Error Handling with Retry Logic
```javascript
// scrapers/scrapeWithRetry.js
const scrapeWithRetry = async (scrapeFunction, username, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeFunction(username);
      return { success: true, data: result };
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { success: false, error: lastError.message };
};
```

## 🌐 API Endpoints

### Student Profile API
```javascript
// routes/studentRoutes.js
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const [userRows] = await pool.execute(
      `SELECT u.*, sp.total_score, sp.university_rank, sp.department_rank
       FROM users u
       LEFT JOIN student_performance sp ON u.user_id = sp.student_id
       WHERE u.user_id = ?`,
      [studentId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const [platformRows] = await pool.execute(
      `SELECT platform, username, 
              leetcode_easy, leetcode_medium, leetcode_hard,
              codechef_rating, codechef_stars, codechef_problems,
              gfg_school, gfg_basic, gfg_easy, gfg_medium, gfg_hard,
              hackerrank_stars, last_updated, status
       FROM coding_profiles 
       WHERE student_id = ?`,
      [studentId]
    );

    res.json({
      user: userRows[0],
      platforms: platformRows
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

### Bulk Import API
```javascript
// routes/facultyRoutes.js
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ dest: 'uploads/' });

router.post('/bulk-import', authenticateToken, authorizeRole(['faculty', 'hod']), 
  upload.single('file'), async (req, res) => {
  
  try {
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = { success: 0, failed: 0, errors: [] };
    
    for (const row of data) {
      try {
        const hashedPassword = await hashPassword(row.password || 'default123');
        
        await pool.execute(
          `INSERT INTO users (user_id, email, password, role, name, dept, year, section)
           VALUES (?, ?, ?, 'student', ?, ?, ?, ?)`,
          [row.user_id, row.email, hashedPassword, row.name, 
           row.dept, row.year, row.section]
        );
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${row.user_id}: ${error.message}`);
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(results);

  } catch (error) {
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});
```

## ⚛️ Frontend Components

### Authentication Context
```javascript
// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp > Date.now() / 1000) {
          setUser(decoded);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Route Component
```javascript
// components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### API Hook
```javascript
// hooks/useAPI.js
import { useState, useEffect } from 'react';

const useAPI = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

## 🛠️ Utility Functions

### User ID Validation
```javascript
// utils/userValidation.js
const normalizeUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return '';
  return userId.toUpperCase();
};

const isValidUserId = (userId, role = 'student') => {
  const normalized = normalizeUserId(userId);
  
  if (!/^[A-Z0-9]+$/.test(normalized) || /\s/.test(normalized)) {
    return false;
  }
  
  if (role === 'student') {
    return normalized.length === 10;
  }
  
  return normalized.length > 0;
};
```

### Scoring Calculator
```javascript
// utils/scoreCalculator.js
const calculatePlatformScore = async (platformData, gradingSystem) => {
  let totalScore = 0;
  
  // LeetCode scoring
  if (platformData.leetcode_easy) {
    totalScore += platformData.leetcode_easy * gradingSystem.leetcode_easy;
  }
  if (platformData.leetcode_medium) {
    totalScore += platformData.leetcode_medium * gradingSystem.leetcode_medium;
  }
  if (platformData.leetcode_hard) {
    totalScore += platformData.leetcode_hard * gradingSystem.leetcode_hard;
  }
  
  // CodeChef scoring
  if (platformData.codechef_problems) {
    totalScore += platformData.codechef_problems * gradingSystem.codechef_problems;
  }
  if (platformData.codechef_stars) {
    totalScore += platformData.codechef_stars * gradingSystem.codechef_stars;
  }
  
  // GeeksforGeeks scoring
  const gfgFields = ['gfg_school', 'gfg_basic', 'gfg_easy', 'gfg_medium', 'gfg_hard'];
  gfgFields.forEach(field => {
    if (platformData[field]) {
      totalScore += platformData[field] * gradingSystem[field];
    }
  });
  
  // HackerRank scoring
  if (platformData.hackerrank_stars) {
    totalScore += platformData.hackerrank_stars * gradingSystem.hackerrank_stars;
  }
  
  return Math.round(totalScore);
};
```

## ⏰ Cron Jobs & Scheduling

### Weekly Performance Update
```javascript
// server.js - Cron job setup
const cron = require('node-cron');
const { updateAllStudentsPerformance } = require('./scrapers/scrapeAndUpdatePerformance');

// Every Saturday at midnight
cron.schedule('0 0 * * 6', async () => {
  logger.info('[CRON] Starting weekly student performance update...');
  
  try {
    const result = await updateAllStudentsPerformance();
    logger.info(`[CRON] Weekly update completed: ${result.updated} students processed`);
  } catch (error) {
    logger.error(`[CRON] Weekly update failed: ${error.message}`);
  }
});
```

### Daily Ranking Update
```javascript
// updateRankings.js
const updateRankings = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update university rankings
    await connection.execute(`
      UPDATE student_performance sp1
      JOIN (
        SELECT student_id, 
               ROW_NUMBER() OVER (ORDER BY total_score DESC, student_id ASC) as new_rank
        FROM student_performance 
        WHERE total_score > 0
      ) sp2 ON sp1.student_id = sp2.student_id
      SET sp1.university_rank = sp2.new_rank
    `);
    
    // Update department rankings
    await connection.execute(`
      UPDATE student_performance sp1
      JOIN users u ON sp1.student_id = u.user_id
      JOIN (
        SELECT u2.user_id,
               ROW_NUMBER() OVER (
                 PARTITION BY u2.dept 
                 ORDER BY sp2.total_score DESC, u2.user_id ASC
               ) as dept_rank
        FROM student_performance sp2
        JOIN users u2 ON sp2.student_id = u2.user_id
        WHERE sp2.total_score > 0
      ) ranked ON sp1.student_id = ranked.user_id
      SET sp1.department_rank = ranked.dept_rank
    `);
    
    await connection.commit();
    
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM student_performance WHERE total_score > 0'
    );
    
    return { studentsUpdated: countResult[0].count };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
```

### Visitor Cleanup Job
```javascript
// Cleanup inactive visitor sessions every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    await pool.execute(
      `UPDATE visitor_sessions 
       SET is_active = 0 
       WHERE last_visit < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
    );
  } catch (error) {
    logger.error(`[CRON] Visitor cleanup failed: ${error.message}`);
  }
});
```

---

**These code snippets represent the core functionality and best practices implemented in the Code to Win platform.**