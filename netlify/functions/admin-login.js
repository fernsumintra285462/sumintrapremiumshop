// Netlify Function: ตรวจสอบรหัสผ่าน Admin ฝั่งเซิร์ฟเวอร์
// รหัสผ่านเก็บไว้ใน Environment Variables ของ Netlify เท่านั้น
// ไม่ปรากฏอยู่ในโค้ดหน้าเว็บ (index.html) อีกต่อไป

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405);
  }

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return json({
      success: false,
      message: 'ยังไม่ได้ตั้งค่า ADMIN_USERNAME / ADMIN_PASSWORD ใน Netlify Environment variables'
    }, 500);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.username || '').trim();
    const password = body.password || '';

    const valid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!valid) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
    }

    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    return json({ success: true, token });
  } catch (err) {
    return json({
      success: false,
      message: 'เกิดข้อผิดพลาดระหว่างตรวจสอบ: ' + (err && err.message ? err.message : 'unknown')
    }, 500);
  }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export const config = {
  path: '/api/admin-login'
};
