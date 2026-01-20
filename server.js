// server.js
// Simple Express server for AI Resume & Portfolio Builder
// - Exposes POST /generate-resume
// - Uses Groq API (LLaMA 3) to generate an ATS-friendly resume and short cover letter

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic validation for Groq API key
if (!process.env.GROQ_API_KEY) {
  console.warn(
    "Warning: GROQ_API_KEY is not set. The /generate-resume endpoint will not work until you set it in the .env file."
  );
} else {
  console.log("✓ GROQ_API_KEY loaded successfully");
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Middleware
app.use(cors()); // Allow cross-origin requests (useful during local development)
app.use(express.json()); // Parse JSON bodies

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Helper function to build the prompt for the Groq API
function buildPrompt({ name, email, education, skills, projects, experience }) {
  // Fallback text for optional field Experience
  const experienceText =
    experience && experience.trim().length > 0 ? experience : "No formal work experience.";

  // Exact prompt requested (with placeholders filled in)
  return `
Generate an ATS-friendly professional resume for a student.

CRITICAL: You MUST use the EXACT information provided below. NEVER create placeholders like "[Insert University Name]", "(Name of University)", "[Insert Project Description]", or any similar placeholders. If information is provided, use it exactly as given. If information is missing, simply omit that detail or write "Not specified" - but NEVER use brackets or parentheses with placeholder text.

STUDENT INFORMATION (USE EXACTLY AS PROVIDED):
- Full Name: ${name || "Not provided"}
- Email Address: ${email || "Not provided"}
- Education Details: ${education || "Not provided"}
- Skills List: ${skills || "Not provided"}
- Projects Description: ${projects || "Not provided"}
- Work Experience: ${experienceText}

RESUME FORMATTING REQUIREMENTS:
- Use clear section headings: CONTACT INFORMATION, SUMMARY, EDUCATION, SKILLS, PROJECTS, EXPERIENCE
- Use bullet points for lists
- Keep language concise and professional
- Write for a fresher / entry-level candidate
- In EDUCATION section: Use the exact education details provided above (${education || "Not provided"})
- In SKILLS section: List the exact skills provided above (${skills || "Not provided"}), formatted as bullet points
- In PROJECTS section: Describe the exact project(s) provided above (${projects || "Not provided"}) with details
- In EXPERIENCE section: Use the experience information provided (${experienceText})
- For optional contact fields (phone, LinkedIn): Omit them or write "Available upon request" - do NOT use placeholders

COVER LETTER REQUIREMENTS:
- After the resume, add a clear separator: "=== COVER LETTER ==="
- Write a professional cover letter (8-12 sentences)
- Use the person's actual name: ${name || "the candidate"}
- Reference their actual education: ${education || "their education"}
- Mention their actual skills: ${skills || "their skills"}
- Reference their actual project: ${projects || "their projects"}
- Do NOT use any placeholders in the cover letter

OUTPUT REQUIREMENTS:
- Generate a COMPLETE resume - do not truncate or cut off mid-sentence
- Generate a COMPLETE cover letter - do not truncate or cut off mid-sentence
- Use the actual data provided - NO placeholders, NO brackets, NO "(Insert...)" text
`;
}

// POST /generate-resume
// Expects JSON body:
// {
//   "name": "...",
//   "email": "...",
//   "education": "...",
//   "skills": "...",
//   "projects": "...",
//   "experience": "..."   // optional
// }
app.post("/generate-resume", async (req, res) => {
  const { name, email, education, skills, projects, experience } = req.body || {};

  // Very basic input validation for beginners
  if (!name || !email || !education || !skills || !projects) {
    return res.status(400).json({
      error:
        "Missing required fields. Please provide name, email, education, skills, and projects.",
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error:
        "GROQ_API_KEY is not configured on the server. Please set it in the .env file.",
    });
  }

  try {
    const prompt = buildPrompt({
      name,
      email,
      education,
      skills,
      projects,
      experience,
    });

    // Call Groq's Chat Completions API using a LLaMA 3 model
    // Common Groq models: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Updated to standard Groq model name
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer who creates ATS-friendly resumes and concise professional cover letters for students and freshers. CRITICAL RULE: You MUST use the EXACT information provided by the user. NEVER create placeholders like '[Insert University Name]', '(Name of University)', '[Insert Project Description]', or any text in brackets or parentheses that asks the user to insert information. If information is provided, use it exactly. If information is missing, omit that detail or write 'Not specified' - but NEVER use placeholder syntax. Follow the user's instructions exactly and keep everything suitable for an entry-level candidate. Always generate COMPLETE resumes and cover letters - do not truncate or cut off mid-sentence.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6, // Slight creativity, but still focused
      max_tokens: 2048, // Ensure we get a complete response (increase if needed)
    });

    const fullText = completion.choices[0]?.message?.content || "";
    
    // Log response length for debugging
    console.log(`Generated response length: ${fullText.length} characters`);
    if (fullText.length > 0) {
      console.log(`Response preview (first 200 chars): ${fullText.substring(0, 200)}...`);
    }

    // Try to split resume and cover letter using a separator if present
    // We tell the model to use a clear separator line; here we accept a few variants
    let resumeText = fullText;
    let coverLetter = "";

    const separators = [
      "=== COVER LETTER ===",
      "-----",
      "COVER LETTER:",
      "Cover Letter:",
      "COVER LETTER",
    ];

    for (const sep of separators) {
      if (fullText.includes(sep)) {
        const parts = fullText.split(sep);
        resumeText = parts[0].trim();
        coverLetter = parts.slice(1).join(sep).trim();
        break;
      }
    }

    // If we could not split, just return everything as resumeText
    // and keep coverLetter empty; the frontend can still display fullText
    if (!coverLetter) {
      coverLetter = "Cover letter not clearly separated. Please use the full text above.";
    }

    return res.json({
      resumeText,
      coverLetter,
      raw: fullText, // include raw text for debugging or advanced usage
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error("Error while generating resume:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return more specific error message to help debug
    let errorMessage = "Failed to generate resume. Please try again later.";
    
    if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    // Check for common Groq API errors
    if (error.status === 401) {
      errorMessage = "Invalid API key. Please check your GROQ_API_KEY in the .env file.";
    } else if (error.status === 429) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (error.status === 400) {
      errorMessage = `Bad request: ${error.message || "Invalid request format"}`;
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


