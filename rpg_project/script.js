const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercase = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generatePassword() {
    const length = parseInt(document.getElementById("length").value);
    const useUppercase = document.getElementById("uppercase").checked;
    const useLowercase = document.getElementById("lowercase").checked;
    const useNumbers = document.getElementById("numbers").checked;
    const useSpecial = document.getElementById("special").checked;

    let chars = "";
    if (useUppercase) chars += uppercase;
    if (useLowercase) chars += lowercase;
    if (useNumbers) chars += numbers;
    if (useSpecial) chars += special;

    if (chars === "") {
        document.getElementById("password").value = "";
        document.getElementById("suggestion").textContent = "Please select at least one character type.";
        return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    document.getElementById("password").value = password;
    const suggestion = checkPasswordStrength(useUppercase, useLowercase, useNumbers, useSpecial, length);
    document.getElementById("suggestion").textContent = suggestion;
    const entropy = calculateEntropy(chars, length);
    document.getElementById("entropy").textContent = `Entropy: ${entropy.toFixed(2)} bits (Higher is stronger)`;
}

function checkPasswordStrength(upper, lower, num, special, length) {
    const typesSelected = [upper, lower, num, special].filter(Boolean).length;
    if (typesSelected < 3 || length < 8) {
        return "Weak password! Use at least 3 character types and a length of 8 or more.";
    }
    return "";
}

function calculateEntropy(chars, length) {
    const poolSize = chars.length;
    return length * Math.log2(poolSize);
}

function copyPassword() {
    const password = document.getElementById("password").value;
    navigator.clipboard.writeText(password).then(() => {
        alert("Password copied to clipboard!");
    });
}

function downloadPassword() {
    const password = document.getElementById("password").value;
    const blob = new Blob([password], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "password.txt";
    a.click();
    URL.revokeObjectURL(url);
}

function savePassword() {
    const password = document.getElementById("password").value;
    const entropy = parseFloat(document.getElementById("entropy").textContent.split(": ")[1]);
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const mobile = localStorage.getItem("userMobile") || "";

    if (!password) {
        alert("Please generate a password first!");
        return;
    }

    if (!name || !email) {
        alert("Please enter your details in the popup form!");
        document.getElementById("userPopup").style.display = "flex";
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "save_password.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(`name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(password)}&entropy=${entropy}`);

    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    console.log("Save success:", response.message);
                    alert("Password saved successfully!");
                    loadSavedPasswords();
                } else {
                    console.error("Save error:", response.message);
                    alert("Error saving password: " + response.message);
                }
            } catch (e) {
                console.error("JSON parse error:", e, xhr.responseText);
                alert("Error saving password: Invalid response from server. Check console for details.");
            }
        } else {
            console.error("Save error:", xhr.status, xhr.responseText);
            alert("Error saving password: Server responded with status " + xhr.status + ". Check console for details.");
        }
    };
    xhr.onerror = function () {
        console.error("Network error during save:", xhr.statusText);
        alert("Network error while saving password. Check console for details.");
    };
}

function loadSavedPasswords() {
    const email = localStorage.getItem("userEmail");
    if (!email) {
        console.log("No email in localStorage, skipping password load");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "get_passwords.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(`email=${encodeURIComponent(email)}`);

    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const passwords = JSON.parse(xhr.responseText);
                console.log("Loaded passwords:", passwords);
                const tbody = document.getElementById("passwordTableBody");
                tbody.innerHTML = "";

                passwords.forEach(p => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${p.date}</td>
                        <td>${p.time}</td>
                        <td>${p.password}</td>
                        <td>${p.entropy.toFixed(2)}</td>
                    `;
                    if (isPasswordExpired(p.date)) {
                        row.style.backgroundColor = "#ffe6e6";
                    }
                    tbody.appendChild(row);
                });
            } catch (e) {
                console.error("JSON parse error:", e, xhr.responseText);
                alert("Error loading passwords: Invalid response from server. Check console for details.");
            }
        } else {
            console.error("Load error:", xhr.status, xhr.responseText);
            alert("Error loading passwords: Server responded with status " + xhr.status + ". Check console for details.");
        }
    };
    xhr.onerror = function () {
        console.error("Network error during load:", xhr.statusText);
        alert("Network error while loading passwords. Check console for details.");
    };
}

function isPasswordExpired(date) {
    const savedDate = new Date(date);
    const currentDate = new Date();
    const diffDays = (currentDate - savedDate) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
}

document.getElementById("userForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    const mobile = document.getElementById("userMobile").value;

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    if (mobile) localStorage.setItem("userMobile", mobile);

    console.log("User data saved to localStorage:", { name, email, mobile });
    document.getElementById("userPopup").style.display = "none";
    loadSavedPasswords();
});

window.onload = function () {
    if (!localStorage.getItem("userName") || !localStorage.getItem("userEmail")) {
        setTimeout(() => {
            document.getElementById("userPopup").style.display = "flex";
        }, 2000);
    } else {
        console.log("Loading passwords on page load");
        loadSavedPasswords();
    }
};