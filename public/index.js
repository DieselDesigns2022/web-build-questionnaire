// public/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("questionnaire-form");
  const questionsContainer = document.getElementById("questions-container");

  try {
    const response = await fetch("/api/questions");
    const questions = await response.json();

    questions.forEach((q) => {
      const label = document.createElement("label");
      label.textContent = q.question;

      const input = document.createElement("input");
      input.name = q.name;
      input.type = "text";
      input.required = true;

      const div = document.createElement("div");
      div.appendChild(label);
      div.appendChild(input);

      questionsContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Failed to load questions:", error);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      window.location.href = "/success.html";
    } else {
      alert("Failed to submit form.");
    }
  });
});
