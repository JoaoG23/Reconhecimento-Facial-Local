export const salvarRostoEmDB = async (name: string, descriptor: Float32Array) => {
    const savedData = localStorage.getItem("faceUsers");
    const users = savedData ? JSON.parse(savedData) : [];
    
    const newUser = {
        name,
        descriptor: Array.from(descriptor)
    };
    
    users.push(newUser);
    localStorage.setItem("faceUsers", JSON.stringify(users));
    return newUser;
}