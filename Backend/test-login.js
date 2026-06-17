const http = require('http');

async function run() {
  console.log("1. Logging in...");
  let res = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "adityacloud07@gmail.com",
      password: "Password123!"
    })
  });
  
  const loginData = await res.json();
  console.log("Login Response Status:", res.status);
  console.log("Login Response Data:", loginData);
  
  const cookies = res.headers.get('set-cookie');
  console.log("Set-Cookie Header:", cookies);

  if (cookies) {
    console.log("\n2. Fetching /auth/me with cookie...");
    const meRes = await fetch("http://localhost:5000/api/v1/auth/me", {
      headers: { "Cookie": cookies }
    });
    console.log("Me Response Status:", meRes.status);
    console.log("Me Response:", await meRes.json());
  } else {
    console.log("Cookie was NOT set.");
  }
}
run();
