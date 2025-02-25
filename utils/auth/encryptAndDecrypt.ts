import crypto from 'crypto';

interface IEncrypt {
  data: string;
  key: string;
}
interface IDecrypt {
  data: string;
  key: string;
}

function encrypt({ data, key }: IEncrypt) {
  try {
    const iv = crypto.randomBytes(16);
    const bufferKey = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv('aes-256-ctr', bufferKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const ivHex = iv.toString('hex');
    return ivHex + '|' + encrypted;
  } catch (err) {
    console.log('encriptErro', err);
    throw new Error('Error encrypting data');
  }
}

function decrypt({ data, key }: IDecrypt) {
  try {
    const parts = data.split('|');
    const iv = Buffer.from(parts[0], 'hex');
    const bufferKey = Buffer.from(key, 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-ctr', bufferKey, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Error decrypting data');
  }
}

export { encrypt, decrypt };
