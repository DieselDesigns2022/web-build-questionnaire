// Fetch and display the agreement text
fetch('/agreement.txt')
  .then(res => res.text()) // ✅ Use text() for plain text
  .then(text => {
    const agreementEl = document.getElementById('agreementText');
    if (agreementEl) {
      agreementEl.innerText = text;
    }
  })
  .catch(err => {
    console.error("❌ Failed to load agreement:", err);
  });
