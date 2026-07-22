// Arrow Function + Array Methods + Async/Await
const fetchUserData = async () => {
    console.log("Fetching user list...");
    
    // Simulating delay
    const users = [
        { id: 1, name: "Zain", role: "Developer" },
        { id: 2, name: "Ali", role: "Designer" }
    ];

    // Array Filter Method (ES6)
    const developers = users.filter(user => user.role === "Developer");
    
    console.log("Developers Found:", developers);
};

fetchUserData();
