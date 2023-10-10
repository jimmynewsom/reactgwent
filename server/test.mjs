import bcrypt from "bcrypt";

async function encrypt(plaintext) {
    let ciphertext = await bcrypt.hash(plaintext, 10);
    console.log(ciphertext);
    return ciphertext;
}

async function testEncryption(plaintext, ciphertext) {
    return await bcrypt.compare(plaintext, ciphertext);
}

let plainPassword = "Business69420";
let encryptedPassword = await encrypt(plainPassword)

let result = await testEncryption(plainPassword, encryptedPassword);

console.log(result);