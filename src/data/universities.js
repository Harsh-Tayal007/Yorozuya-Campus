// src/data/universities.js

export const universities = [
  {
    id: "jcbose",
    name: "JC Bose University of Science & Technology",
    location: "Faridabad, Haryana",
    shortName: "JCBUST",

    courses: [
      {
        id: "btech",
        name: "B.Tech",
        duration: "4 Years",

        branches: [
          { id: "cse", name: "Computer Science Engineering", semesters: 8 },
          { id: "ece", name: "Electronics & Communication Engineering", semesters: 8 },
          { id: "me", name: "Mechanical Engineering", semesters: 8 },
        ],
      },

      {
        id: "mtech",
        name: "M.Tech",
        duration: "2 Years",

        branches: [
          { id: "cse", name: "Computer Science Engineering", semesters: 4 },
        ],
      },
    ],
  },

  // ============================
  // 1️⃣ Delhi Technological University
  // ============================
  {
    id: "dtu",
    name: "Delhi Technological University",
    location: "New Delhi, Delhi",
    shortName: "DTU",

    courses: [
      {
        id: "btech",
        name: "B.Tech",
        duration: "4 Years",

        branches: [
          { id: "cse", name: "Computer Science Engineering", semesters: 8 },
          { id: "it", name: "Information Technology", semesters: 8 },
          { id: "ee", name: "Electrical Engineering", semesters: 8 },
          { id: "ce", name: "Civil Engineering", semesters: 8 },
        ],
      },

      {
        id: "mba",
        name: "MBA (Technology Management)",
        duration: "2 Years",

        branches: [
          { id: "tm", name: "Technology Management", semesters: 4 },
          { id: "fm", name: "Financial Management", semesters: 4 },
        ],
      },
    ],
  },

  // ============================
  // 2️⃣ NIT Trichy
  // ============================
  {
    id: "nitt",
    name: "National Institute of Technology Tiruchirappalli",
    location: "Tiruchirappalli, Tamil Nadu",
    shortName: "NITT",

    courses: [
      {
        id: "btech",
        name: "B.Tech",
        duration: "4 Years",

        branches: [
          { id: "cse", name: "Computer Science Engineering", semesters: 8 },
          { id: "eee", name: "Electrical & Electronics Engineering", semesters: 8 },
          { id: "che", name: "Chemical Engineering", semesters: 8 },
          { id: "prod", name: "Production Engineering", semesters: 8 },
        ],
      },

      {
        id: "mtech",
        name: "M.Tech",
        duration: "2 Years",

        branches: [
          { id: "ds", name: "Data Science & AI", semesters: 4 },
          { id: "vlsi", name: "VLSI Systems", semesters: 4 },
        ],
      },

      {
        id: "msc",
        name: "M.Sc",
        duration: "2 Years",

        branches: [
          { id: "maths", name: "Mathematics & Computing", semesters: 4 },
          { id: "physics", name: "Physics", semesters: 4 },
        ],
      },
    ],
  },

  // ============================
  // 3️⃣ University of Mumbai
  // ============================
  {
    id: "mu",
    name: "University of Mumbai",
    location: "Mumbai, Maharashtra",
    shortName: "MU",

    courses: [
      {
        id: "bscit",
        name: "B.Sc IT",
        duration: "3 Years",

        branches: [
          { id: "it", name: "Information Technology", semesters: 6 },
          { id: "cs", name: "Computer Science", semesters: 6 },
        ],
      },

      {
        id: "bcom",
        name: "B.Com",
        duration: "3 Years",

        branches: [
          { id: "acc", name: "Accounting & Finance", semesters: 6 },
          { id: "bank", name: "Banking & Insurance", semesters: 6 },
        ],
      },

      {
        id: "mba",
        name: "MBA",
        duration: "2 Years",

        branches: [
          { id: "mkt", name: "Marketing", semesters: 4 },
          { id: "hr", name: "Human Resources", semesters: 4 },
          { id: "ops", name: "Operations Management", semesters: 4 },
        ],
      },
    ],
  },
];
