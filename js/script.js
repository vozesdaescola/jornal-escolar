// URL do backend (modifique para a URL do seu servidor)
const API_URL = "http://localhost:3000/api"; // substitua pelo backend online depois

// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // Exemplo de requisição
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        alert(data.message || "Login feito com sucesso!");
    } catch (err) {
        alert("Erro no login");
        console.error(err);
    }
});

// Criar usuário (Admin)
document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        alert(data.message || "Usuário criado!");
    } catch (err) {
        alert("Erro ao criar usuário");
        console.error(err);
    }
});

// Upload de arquivo
document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("file-input");
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        alert(data.message || "Arquivo enviado!");
    } catch (err) {
        alert("Erro ao enviar arquivo");
        console.error(err);
    }
});
