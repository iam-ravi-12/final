const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let str = base64.replace(/=+$/, '');
    let output = '';
    
    if (str.length % 4 === 1) {
      return null;
    }
    
    for (
      let bc = 0, bs = 0, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    
    try {
      return JSON.parse(decodeURIComponent(escape(output)));
    } catch {
      return JSON.parse(output);
    }
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZW1wYWRtaW4xNzg0MDI4NzIzNjgxIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg0MDI4NzMxLCJleHAiOjE3ODQxMTUxMzF9.g7BE3r38UqRxHxvy0Phlsi8sUmqULvRXSCcZw7j9OVM";
console.log("Decoded:", decodeJwt(token));
