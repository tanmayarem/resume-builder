// script.js
// Frontend logic for AI Resume & Portfolio Builder

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resume-form");
  const generateBtn = document.getElementById("generate-btn");
  const btnText = generateBtn.querySelector(".btn-text");
  const btnLoader = generateBtn.querySelector(".btn-loader");
  const statusText = document.getElementById("status");
  const resumeOutput = document.getElementById("resume-output");
  const coverLetterOutput = document.getElementById("cover-letter-output");
  const copyResumeBtn = document.getElementById("copy-resume-btn");
  const copyCoverBtn = document.getElementById("copy-cover-btn");

  // Helper to update status text with a specific style
  function setStatus(message, type) {
    statusText.textContent = message || "";
    statusText.classList.remove("status--loading", "status--error", "status--success");
    if (type) {
      statusText.classList.add(`status--${type}`);
    }
  }

  // Helper to copy text to clipboard
  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = button.textContent;
      button.textContent = "✅ Copied!";
      button.classList.add("copied");
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard. Please select and copy manually.");
    }
  }

  // Copy resume button handler
  copyResumeBtn.addEventListener("click", () => {
    const text = resumeOutput.textContent;
    if (text && text.trim()) {
      copyToClipboard(text, copyResumeBtn);
    } else {
      alert("No resume generated yet. Please generate a resume first.");
    }
  });

  // Copy cover letter button handler
  copyCoverBtn.addEventListener("click", () => {
    const text = coverLetterOutput.textContent;
    if (text && text.trim()) {
      copyToClipboard(text, copyCoverBtn);
    } else {
      alert("No cover letter generated yet. Please generate a resume first.");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default form submission (page reload)

    // Read values from the form inputs
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const education = document.getElementById("education").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const projects = document.getElementById("projects").value.trim();
    const experience = document.getElementById("experience").value.trim();

    // Simple front-end validation
    if (!name || !email || !education || !skills || !projects) {
      setStatus("Please fill in all required fields (marked with *).", "error");
      return;
    }

    // Disable button while loading to prevent duplicate requests
    generateBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";
    setStatus("Generating your resume and cover letter. Please wait...", "loading");
    resumeOutput.textContent = "";
    coverLetterOutput.textContent = "";

    try {
      const response = await fetch("/generate-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          education,
          skills,
          projects,
          experience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.error ||
          `Request failed with status ${response.status}. Please check your server logs.`;
        console.error("Server error:", errorData);
        throw new Error(message);
      }

      const data = await response.json();
      
      // Log received data for debugging
      console.log("Received resume data:", {
        resumeLength: data.resumeText?.length || 0,
        coverLetterLength: data.coverLetter?.length || 0,
        rawLength: data.raw?.length || 0,
      });

      // Prefer raw text (complete response) if available, otherwise use resumeText
      resumeOutput.textContent = data.raw || data.resumeText || "No resume generated.";
      
      coverLetterOutput.textContent =
        data.coverLetter && data.coverLetter !== "Cover letter not clearly separated. Please use the full text above."
          ? data.coverLetter
          : "Cover letter could not be separated automatically. You can adapt the main text above into a cover letter.";

      setStatus("Resume and cover letter generated successfully.", "success");
    } catch (error) {
      console.error("Error in frontend while calling /generate-resume:", error);
      setStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      generateBtn.disabled = false;
      btnText.style.display = "inline-block";
      btnLoader.style.display = "none";
    }
  });
});


