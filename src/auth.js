const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signToken(user) {
  const payload = {
    sub: user.id,
    companyId: user.company_id,
    role: user.role,
    email: user.email,
    name: user.full_name,
    exp: Date.now() + 8 * 60 * 60 * 1000
  };
  const encodedPayload = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyAuthHeader(header) {
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { ok: false, error: 'Token requerido' };
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return { ok: false, error: 'Token inválido' };

  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  if (expectedSig !== signature) return { ok: false, error: 'Firma inválida' };

  try {
    const user = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (!user.exp || user.exp < Date.now()) return { ok: false, error: 'Token expirado' };
    return { ok: true, user };
  } catch (_error) {
    return { ok: false, error: 'Payload inválido' };
  }
}

module.exports = { signToken, verifyAuthHeader };
