export type Category = "OBC" | "SC" | "ST" | "OPEN" | "EWS" | "MINORITY" | "PWD" | "ALL";
export type EducationLevel = "School (9-10th)" | "Higher Secondary (11-12th)" | "Diploma" | "Undergraduate" | "Postgraduate" | "PhD / Research";
export type Gender = "All" | "Female" | "Male" | "Transgender";

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  categories: Category[];
  educationLevels: EducationLevel[];
  maxIncomeLimit: number | null; // INR per annum, null if no income ceiling
  minMarksPercent: number; // e.g. 50, 60, 75
  gender: Gender;
  amount: string;
  deadline: string;
  status: "Active" | "Closing Soon" | "Upcoming" | "Always Open";
  state: string; // e.g., "All India", "Maharashtra", "Uttar Pradesh"
  description: string;
  eligibilityCriteria: string[];
  benefits: string[];
  documentsRequired: string[];
  officialUrl: string;
  applySteps: string[];
  featured?: boolean;
}

export interface StudentProfile {
  category: Category;
  educationLevel: EducationLevel;
  annualIncome: number; // in INR
  marksPercent: number; // academic %
  gender: Gender;
  state: string;
  fieldOfStudy?: string;
}

export interface ScholarshipMatch extends Scholarship {
  matchScore: number; // 0 to 100
  matchReasons: string[];
  eligibilityIssues: string[];
}

export const SCHOLARSHIPS_DATA: Scholarship[] = [
  {
    id: "post-matric-obc",
    title: "Post-Matric Scholarship for OBC Students",
    provider: "Ministry of Social Justice & Empowerment, Govt. of India",
    categories: ["OBC"],
    educationLevels: ["Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate", "PhD / Research"],
    maxIncomeLimit: 250000, // 2.5 LPA
    minMarksPercent: 50,
    gender: "All",
    amount: "Up to ₹20,000 / year + Maintenance Allowance",
    deadline: "31st October 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Financial assistance to students belonging to Other Backward Classes (OBC) studying at post-matriculation or post-secondary stage to enable them to complete their education.",
    eligibilityCriteria: [
      "Must belong to OBC category",
      "Annual family income must not exceed ₹2,50,000 per annum",
      "Studying in Class 11th, 12th, UG, PG, or Professional degree course in recognized institution",
      "Passed previous academic year examination with minimum 50% marks"
    ],
    benefits: [
      "100% Maintenance allowance",
      "Reimbursement of compulsory non-refundable fees",
      "Study tour charges & thesis typing charges for higher studies",
      "Special allowance for disabled students"
    ],
    documentsRequired: [
      "Valid Caste / Category Certificate (OBC Non-Creamy Layer)",
      "Income Certificate issued by competent authority",
      "Marksheet of previous qualifying examination",
      "Aadhaar Card linked with Bank Account",
      "Fee Receipt & Bonafide Certificate from Current Institution"
    ],
    officialUrl: "https://scholarships.gov.in/",
    applySteps: [
      "Register on National Scholarship Portal (NSP) with Aadhaar.",
      "Complete OTR (One-Time Registration) verification.",
      "Select 'Post-Matric Scholarship for OBC Students'.",
      "Upload required certificates and submit the application form.",
      "Submit physical documents copy to institute scholarship desk for verification."
    ]
  },
  {
    id: "central-sector-scheme",
    title: "Central Sector Scheme of Scholarships for College and University Students",
    provider: "Department of Higher Education (MHRD), Govt. of India",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS"],
    educationLevels: ["Undergraduate", "Postgraduate"],
    maxIncomeLimit: 450000, // 4.5 LPA
    minMarksPercent: 80,
    gender: "All",
    amount: "₹12,000 / year for UG (3 years) & ₹20,000 / year for PG",
    deadline: "15th November 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Merit-cum-means scholarship for top 80th percentile students of Class 12th board exams pursuing regular graduation and post-graduation courses.",
    eligibilityCriteria: [
      "Students in the top 80th percentile of successful candidates in Class 12th Board Exams",
      "Pursuing regular (not correspondence) UG / PG courses in recognized colleges",
      "Family income from all sources should not exceed ₹4.5 Lakhs per annum",
      "Not receiving any other government scholarship scheme"
    ],
    benefits: [
      "₹12,000 per year at Graduation level for first 3 years",
      "₹20,000 per year at Post-Graduation level",
      "Direct Benefit Transfer (DBT) directly into bank account"
    ],
    documentsRequired: [
      "Class 12th Marksheet & Rank / Percentile Certificate",
      "Annual Family Income Certificate",
      "Aadhaar Card and Bank Passbook (Aadhaar Seeded)",
      "Admission Fee Receipt of College"
    ],
    officialUrl: "https://scholarships.gov.in/",
    applySteps: [
      "Log on to NSP Portal (scholarships.gov.in).",
      "Verify board exam roll number and select Central Sector Scheme.",
      "Fill income and college verification details.",
      "Get institute digital verification done."
    ]
  },
  {
    id: "pm-yasasvi-scheme",
    title: "PM YASASVI Central Sector Scheme for OBC, EBC & DNT Students",
    provider: "Ministry of Social Justice & Empowerment",
    categories: ["OBC", "EWS"],
    educationLevels: ["School (9-10th)", "Higher Secondary (11-12th)", "Undergraduate"],
    maxIncomeLimit: 250000,
    minMarksPercent: 60,
    gender: "All",
    amount: "₹75,000 / year (Class 9-10) to ₹1,25,000 / year (Class 11-12 / College)",
    deadline: "20th November 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Young Achievers Scholarship Award Scheme for Vibrant India (YASASVI) for top meritorious OBC, EBC (Economically Backward Classes), and DNT students.",
    eligibilityCriteria: [
      "Belong to OBC, EBC, or DNT category",
      "Family income less than ₹2.5 Lakhs per annum",
      "Studying in top-rated schools/colleges identified by Ministry"
    ],
    benefits: [
      "Tuition fee + Hostel fee coverage up to ₹1.25 Lakhs per annum",
      "Stationery & laptop allowances for top institutional students"
    ],
    documentsRequired: [
      "OBC / EBC Certificate",
      "Income Certificate",
      "Class 8th / 10th Marksheet",
      "Aadhaar Card"
    ],
    officialUrl: "https://yet.nta.ac.in/",
    applySteps: [
      "Register on YASASVI NTA Portal or NSP Portal.",
      "Upload income and category documents.",
      "Select your enrolled institution."
    ]
  },
  {
    id: "post-matric-sc-st",
    title: "Post-Matric Scholarship for SC & ST Students",
    provider: "Ministry of Social Justice / Tribal Affairs, Govt. of India",
    categories: ["SC", "ST"],
    educationLevels: ["Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate", "PhD / Research"],
    maxIncomeLimit: 250000,
    minMarksPercent: 45,
    gender: "All",
    amount: "100% Tuition Fee Waiver + Up to ₹13,500 Maintenance Allowance / year",
    deadline: "30th November 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Centrally sponsored scheme providing financial support to SC & ST students at post-secondary stage to complete their higher education.",
    eligibilityCriteria: [
      "Must belong to SC or ST Scheduled Category",
      "Annual family income limit ₹2.5 Lakhs per annum",
      "Enrolled in any recognized university/college for post-matric study"
    ],
    benefits: [
      "Full compulsory fee exemption",
      "Monthly maintenance allowance up to ₹1,350/month for hostellers",
      "Book bank and study allowance"
    ],
    documentsRequired: [
      "Cast Certificate (SC/ST)",
      "Income Certificate",
      "Previous Year Marksheet",
      "Aadhaar & Bank Details"
    ],
    officialUrl: "https://scholarships.gov.in/",
    applySteps: [
      "Apply via NSP portal under Ministry of Social Justice / Tribal Affairs.",
      "Submit verified income and caste certificates.",
      "Verification by Institute Nodal Officer."
    ]
  },
  {
    id: "aicte-pragati-girls",
    title: "AICTE Pragati Scholarship for Female Students (Engineering & Tech)",
    provider: "All India Council for Technical Education (AICTE)",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS"],
    educationLevels: ["Diploma", "Undergraduate"],
    maxIncomeLimit: 800000, // 8 LPA
    minMarksPercent: 60,
    gender: "Female",
    amount: "₹50,000 per annum for all years of study",
    deadline: "31st October 2026",
    status: "Closing Soon",
    state: "All India",
    featured: true,
    description: "Scheme aimed at empowering girl students by providing financial support to pursue technical degree or diploma education in AICTE approved institutions.",
    eligibilityCriteria: [
      "Girl student admitted to 1st year degree/diploma course or 2nd year through Lateral Entry in AICTE approved college",
      "Maximum 2 girls per family eligible",
      "Family income should not exceed ₹8.0 Lakh per annum"
    ],
    benefits: [
      "₹50,000 per annum for purchase of books, equipment, soft wares, laptop, desktop, etc.",
      "No separate hostel fee or tuition fee receipt needed"
    ],
    documentsRequired: [
      "Class 10th and 12th Marksheet",
      "Income Certificate issued by Tehsildar/competent authority",
      "AICTE Allotment Letter for degree/diploma admission",
      "Bank Account passbook copy & Aadhaar card"
    ],
    officialUrl: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    applySteps: [
      "Register on National Scholarship Portal (NSP).",
      "Choose Pragati Scholarship Scheme for Girl Students (Technical).",
      "Upload AICTE admission proof & family income proof."
    ]
  },
  {
    id: "reliance-foundation-ug",
    title: "Reliance Foundation Undergraduate Scholarship",
    provider: "Reliance Foundation",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS", "MINORITY", "PWD"],
    educationLevels: ["Undergraduate"],
    maxIncomeLimit: 1500000, // 15 LPA (Preference to < 2.5L)
    minMarksPercent: 60,
    gender: "All",
    amount: "Up to ₹2,00,000 over the duration of the degree course",
    deadline: "15th October 2026",
    status: "Closing Soon",
    state: "All India",
    featured: true,
    description: "Supports meritorious undergraduate students from all socio-economic backgrounds studying any full-time undergraduate degree program in India.",
    eligibilityCriteria: [
      "First-year undergraduate student in any stream (Engineering, Science, Commerce, Arts, Law, Medicine, etc.)",
      "Secured minimum 60% marks in Class 12th",
      "Household income less than ₹15 Lakhs (preference given to income < ₹2.5 Lakhs)",
      "Aptitude test score compulsory"
    ],
    benefits: [
      "Grants up to ₹2 Lakhs for educational expenses",
      "Leadership development workshops and mentorship network",
      "Alumni community membership"
    ],
    documentsRequired: [
      "Class 12th Marksheet",
      "Family Income Proof",
      "College ID / Admission proof",
      "Disability Certificate (if applicable)"
    ],
    officialUrl: "https://www.scholarships.reliancefoundation.org/",
    applySteps: [
      "Fill online eligibility questionnaire.",
      "Complete the application form with essay and achievements.",
      "Take online 60-minute aptitude assessment test."
    ]
  },
  {
    id: "hdfc-badhte-kadam",
    title: "HDFC Bank Parivartan's ECSS Scholarship",
    provider: "HDFC Bank Parivartan",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS", "MINORITY", "PWD"],
    educationLevels: ["School (9-10th)", "Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate"],
    maxIncomeLimit: 250000,
    minMarksPercent: 55,
    gender: "All",
    amount: "Up to ₹75,000 per year",
    deadline: "31st December 2026",
    status: "Active",
    state: "All India",
    featured: false,
    description: "Designed for meritorious students from vulnerable backgrounds facing financial crises or personal hardship to prevent dropouts.",
    eligibilityCriteria: [
      "Open to Indian nationals from Class 1 to Postgraduate level",
      "Must have passed previous examination with at least 55% marks",
      "Annual family income must be less than or equal to ₹2.5 Lakhs",
      "Preference given to students experiencing personal/family crisis"
    ],
    benefits: [
      "School students (Class 1-12): ₹15,000 - ₹18,000 / year",
      "UG Students: ₹30,000 - ₹50,000 / year",
      "PG / Professional Students: ₹75,000 / year"
    ],
    documentsRequired: [
      "Passport size photo & Identity proof",
      "Previous academic year marksheet",
      "Income proof (Form 16A/Income certificate/BPL card)",
      "Proof of admission & bank account details"
    ],
    officialUrl: "https://www.buddy4study.com/page/hdfc-bank-parivartans-ecss-scholarship",
    applySteps: [
      "Apply through Buddy4Study portal.",
      "Upload proof of current income and crisis justification if applicable.",
      "Shortlisted candidates called for telephonic interview."
    ]
  },
  {
    id: "vidyasaarathi-ews",
    title: "Vidyasaarathi Sitaram Jindal Scholarship Scheme",
    provider: "Sitaram Jindal Foundation",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS"],
    educationLevels: ["Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate"],
    maxIncomeLimit: 400000,
    minMarksPercent: 65,
    gender: "All",
    amount: "₹600 to ₹3,200 / month depending on level",
    deadline: "Always Open",
    status: "Always Open",
    state: "All India",
    featured: false,
    description: "Scholarship for underprivileged meritorious students studying from Class 11th to Post Graduation including ITI and Engineering courses.",
    eligibilityCriteria: [
      "For Boys: Min 65% in qualifying exam (60% for SC/ST)",
      "For Girls: Min 60% in qualifying exam (55% for SC/ST)",
      "Family income ceiling ₹4.0 Lakhs for general, ₹2.5 Lakhs for employment holders"
    ],
    benefits: [
      "Monthly financial stipend sent directly to student account",
      "Additional hosteller allowance up to ₹1,800/month"
    ],
    documentsRequired: [
      "Marksheet of SSLC/HSC",
      "Income Certificate",
      "Certificate regarding fee structure from college",
      "Hostel certificate if hosteller"
    ],
    officialUrl: "https://www.sitaramjindalfoundation.org/scholarships.php",
    applySteps: [
      "Download application form Annexure-I.",
      "Get form certified by college Principal.",
      "Send hard copy along with marksheets to Jindal Foundation Bangalore office."
    ]
  },
  {
    id: "moma-minority-post-matric",
    title: "Post-Matric Scholarship for Minority Communities",
    provider: "Ministry of Minority Affairs, Govt. of India",
    categories: ["MINORITY"],
    educationLevels: ["Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate", "PhD / Research"],
    maxIncomeLimit: 200000,
    minMarksPercent: 50,
    gender: "All",
    amount: "Admission & Course Fee up to ₹10,000/year + Maintenance Allowance",
    deadline: "15th November 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Empowers notified minority communities (Muslims, Christians, Sikhs, Buddhists, Jains, and Parsis) to pursue higher education.",
    eligibilityCriteria: [
      "Must belong to one of 6 notified minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)",
      "Secured min 50% marks in final examination",
      "Annual family income less than ₹2.0 Lakh per annum"
    ],
    benefits: [
      "Admission fee reimbursement up to ₹7,000 per annum",
      "Maintenance allowance up to ₹570/month for hostellers"
    ],
    documentsRequired: [
      "Self-declaration Minority Community Certificate",
      "Income Certificate",
      "Academic Marksheet",
      "Aadhaar Card"
    ],
    officialUrl: "https://scholarships.gov.in/",
    applySteps: [
      "Register on NSP.",
      "Select Ministry of Minority Affairs - Post-Matric scheme.",
      "Upload self-declaration certificate."
    ]
  },
  {
    id: "national-handicapped-pwd",
    title: "National Scholarship for Persons with Disabilities (PwD)",
    provider: "Department of Empowerment of Persons with Disabilities",
    categories: ["PWD"],
    educationLevels: ["Higher Secondary (11-12th)", "Diploma", "Undergraduate", "Postgraduate", "PhD / Research"],
    maxIncomeLimit: 600000,
    minMarksPercent: 40,
    gender: "All",
    amount: "₹4,000 to ₹10,000 / month + Book & Reader Allowance",
    deadline: "30th November 2026",
    status: "Active",
    state: "All India",
    featured: true,
    description: "Financial assistance for students with disabilities (min 40% disability) pursuing post-matric, degree, or professional education.",
    eligibilityCriteria: [
      "Disability level of 40% or more (UDID Card holder)",
      "Family income not exceeding ₹6,00,000 per annum",
      "Passed previous academic year exam"
    ],
    benefits: [
      "Maintenance allowance up to ₹4,000/month",
      "Reader allowance for visually impaired students (up to ₹2,000/month)",
      "Disability aid allowance for prosthetics/software"
    ],
    documentsRequired: [
      "UDID Card / Disability Certificate issued by Medical Board",
      "Income Certificate",
      "Aadhaar Card",
      "Previous year marksheet"
    ],
    officialUrl: "https://scholarships.gov.in/",
    applySteps: [
      "Apply on NSP under DEPwD department section.",
      "Provide UDID registration number.",
      "Upload medical board certificate."
    ]
  },
  {
    id: "tata-scholarship-abroad",
    title: "JN Tata Endowment Loan Scholarship for Higher Education Abroad",
    provider: "JN Tata Endowment",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS"],
    educationLevels: ["Postgraduate", "PhD / Research"],
    maxIncomeLimit: null,
    minMarksPercent: 60,
    gender: "All",
    amount: "Loan Scholarship up to ₹10,00,000 + Gift Scholarship up to ₹7,50,000",
    deadline: "28th February 2027",
    status: "Upcoming",
    state: "All India",
    featured: true,
    description: "Prestigious financial support for Indian graduates pursuing Master's, PhD, or Post-doctoral studies abroad in any discipline.",
    eligibilityCriteria: [
      "Indian national with recognized UG/PG degree with at least 60% marks",
      "Admitted or applied to reputed foreign university for PG/PhD studies",
      "No upper age or income restriction (evaluated on academic merit)"
    ],
    benefits: [
      "Loan scholarship up to ₹10 Lakhs at nominal simple interest (waived if repaid on time)",
      "Gift scholarships up to ₹7.5 Lakhs for top scholars",
      "Travel grant reimbursement"
    ],
    documentsRequired: [
      "UG Degree Transcript",
      "University Admission Letter",
      "Statement of Purpose (SOP)",
      "Two Letters of Recommendation (LOR)",
      "Passport copy"
    ],
    officialUrl: "https://www.jntataendowment.org/",
    applySteps: [
      "Register on JN Tata Endowment application portal.",
      "Submit online form along with SOP and academic credentials.",
      "Online interview conducted by expert panel for shortlisted candidates."
    ]
  },
  {
    id: "keep-india-smiling",
    title: "Keep India Smiling Foundational Scholarship & Mentorship",
    provider: "Colgate-Palmolive (India) Limited",
    categories: ["OPEN", "OBC", "SC", "ST", "EWS", "PWD"],
    educationLevels: ["Higher Secondary (11-12th)", "Undergraduate", "Diploma"],
    maxIncomeLimit: 500000,
    minMarksPercent: 60,
    gender: "All",
    amount: "₹30,000 to ₹50,000 per annum for 3-4 years",
    deadline: "31st December 2026",
    status: "Active",
    state: "All India",
    featured: false,
    description: "Provides foundational support and career mentorship to deserving candidates pursuing BDS, Engineering, or 3-year Graduation courses.",
    eligibilityCriteria: [
      "Must have passed Class 12 board exam with minimum 60% marks",
      "Enrolled in 1st year UG / BDS / Engineering degree program",
      "Annual family income less than ₹5 Lakhs"
    ],
    benefits: [
      "Financial assistance up to ₹50,000 per year",
      "One-on-one professional mentorship from Colgate leadership"
    ],
    documentsRequired: [
      "Class 10 & 12 marksheets",
      "Income Certificate / BPL Card",
      "College Admission proof",
      "Govt ID Proof"
    ],
    officialUrl: "https://www.buddy4study.com/page/keep-india-smiling-foundational-scholarship-program",
    applySteps: [
      "Apply online on Buddy4Study.",
      "Upload marksheets and income certificates.",
      "Verification and telephonic interview."
    ]
  }
];

export function calculateMatchScore(student: StudentProfile, scholarship: Scholarship): ScholarshipMatch {
  let score = 100;
  const matchReasons: string[] = [];
  const eligibilityIssues: string[] = [];

  // 1. Category Check
  const categoryMatch = scholarship.categories.includes(student.category) || scholarship.categories.includes("ALL");
  if (categoryMatch) {
    matchReasons.push(`Eligible for your category (${student.category})`);
  } else {
    score -= 40;
    eligibilityIssues.push(`Specific to ${scholarship.categories.join(", ")} categories (Your category: ${student.category})`);
  }

  // 2. Education Level Check
  const levelMatch = scholarship.educationLevels.includes(student.educationLevel);
  if (levelMatch) {
    matchReasons.push(`Matches your education level (${student.educationLevel})`);
  } else {
    score -= 30;
    eligibilityIssues.push(`Requires education level: ${scholarship.educationLevels.join(" or ")}`);
  }

  // 3. Income Limit Check
  if (scholarship.maxIncomeLimit !== null) {
    if (student.annualIncome <= scholarship.maxIncomeLimit) {
      matchReasons.push(`Family income (₹${student.annualIncome.toLocaleString('en-IN')}) is within limit (<= ₹${scholarship.maxIncomeLimit.toLocaleString('en-IN')})`);
    } else {
      score -= 25;
      eligibilityIssues.push(`Family income exceeds scholarship ceiling (Limit: ₹${scholarship.maxIncomeLimit.toLocaleString('en-IN')}/year)`);
    }
  } else {
    matchReasons.push("No income restriction");
  }

  // 4. Marks Percentage Check
  if (student.marksPercent >= scholarship.minMarksPercent) {
    matchReasons.push(`Your academic score (${student.marksPercent}%) meets min requirement (${scholarship.minMarksPercent}%)`);
  } else {
    score -= 20;
    eligibilityIssues.push(`Minimum marks required: ${scholarship.minMarksPercent}% (Your marks: ${student.marksPercent}%)`);
  }

  // 5. Gender Check
  if (scholarship.gender !== "All" && student.gender !== "All") {
    if (scholarship.gender === student.gender) {
      matchReasons.push(`Gender requirement matched (${scholarship.gender})`);
    } else {
      score -= 50;
      eligibilityIssues.push(`Exclusively for ${scholarship.gender} applicants`);
    }
  }

  // Final score clamping
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    ...scholarship,
    matchScore: finalScore,
    matchReasons,
    eligibilityIssues
  };
}
