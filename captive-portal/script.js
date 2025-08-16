const forfaits = [
  { planName: "1 DAY", amount: 1000, duration: "1d" },
  { planName: "7 DAYS", amount: 6500, duration: "7d" },
  { planName: "1 MONTH", amount: 25000, duration: "30d" },
];

let selectedPlan = null;

window.onload = () => {
  const container = document.getElementById("forfaits");
  forfaits.forEach((plan) => {
    const btn = document.createElement("button");
    btn.textContent = `${plan.planName} - ${plan.amount} TZS`;
    btn.className = "forfait-button";
    btn.onclick = () => selectPlan(plan, btn);
    container.appendChild(btn);
  });

  hideElement("selected-message");
  hideElement("form-container");
  hideElement("receipt-container");
};

function selectPlan(plan, btnClicked) {
  selectedPlan = plan;

  hideElement("subtitle");

  document.querySelectorAll(".forfait-button").forEach((btn) => {
    if (btn !== btnClicked) {
      btn.style.display = "none";
    } else {
      btn.classList.add("selected");
    }
  });

  showElement("selected-message");
  showElement("form-container");

  document.getElementById("selected-message").innerHTML = `
    ✅ Umechagua: <strong>${plan.planName} - ${plan.amount} TZS</strong>
  `;

  document.getElementById("message").innerHTML = "";
  hideElement("receipt-container");
}

document.getElementById("payBtn").addEventListener("click", async () => {
  const fullName = document.getElementById("fullname").value.trim();
  const phoneNumber = document.getElementById("phone").value.trim();

  if (!selectedPlan || !fullName || !phoneNumber) {
    alert("Tafadhali jaza jina kamili na namba ya simu.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phoneNumber,
        planName: selectedPlan.planName,
        amount: selectedPlan.amount,
        duration: selectedPlan.duration,
      }),
    });

    const data = await res.json();

    if (data && data.receiptUrl) {
      // Cacher tout sauf la fin
      hideElement("forfaits");
      hideElement("form-container");
      hideElement("selected-message");
      hideElement("subtitle");
      hideElement("message");
      hideElement("final-username");
      hideElement("final-password");

      const loginBtn = document.querySelector(".username-button");
      if (loginBtn) loginBtn.style.display = "none";

      const receiptZone = document.getElementById("receipt-container");
      receiptZone.innerHTML = `
        <div class="success-box" style="margin-bottom: 20px;">
          <p><strong>Malipo yamefanikiwa!</strong></p>
          <p>Username: <strong>${data.username}</strong></p>
          <p>Password: <strong>${data.password}</strong></p>
        </div>

        <button id="connectBtn" class="forfait-button" style="margin-bottom: 15px;">
          Unganishwa na Wi-Fi
        </button>

        <a id="receiptLink" class="forfait-button" href="${data.receiptUrl}" target="_blank" download>
          Pakua risiti
        </a>
      `;

      showElement("receipt-container");

      // 🔁 Redirection locale vers login.html (test local uniquement)
      document.getElementById("connectBtn").onclick = () => {
        const url = `login.html?username=${encodeURIComponent(
          data.username
        )}&password=${encodeURIComponent(data.password)}`;
        window.location.href = url;
      };
    } else {
      alert("Malipo yameshindikana. Tafadhali jaribu tena.");
    }
  } catch (err) {
    alert("Hitilafu ya muunganisho.");
    console.error(err);
  }
});

// Fonctions utilitaires
function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
