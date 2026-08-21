// Netlify Function: proxy สำหรับตรวจสอบสลิปผ่าน SlipOK
// ทำหน้าที่เป็นตัวกลางระหว่างเบราว์เซอร์ลูกค้ากับ SlipOK API
// เพื่อแก้ปัญหา CORS และเก็บ API Key ไว้ฝั่งเซิร์ฟเวอร์ (ไม่เปิดเผยในโค้ดหน้าเว็บ)

export default async (request) => {
  // รองรับ CORS preflight
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

  const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID;
  const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY;

  if (!SLIPOK_BRANCH_ID || !SLIPOK_API_KEY) {
    return json({
      success: false,
      message: 'ยังไม่ได้ตั้งค่า SLIPOK_BRANCH_ID / SLIPOK_API_KEY ใน Netlify Environment variables'
    }, 500);
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get('files');
    const amount = incoming.get('amount');

    if (!file) {
      return json({ success: false, code: 1001, message: 'ไม่พบไฟล์รูปสลิป' }, 400);
    }

    const outgoing = new FormData();
    outgoing.append('files', file);
    // ชั่วคราว: ทดสอบไม่ส่ง amount ไปเช็คว่าเป็นสาเหตุของ error "ยอดไม่ตรง" หรือไม่
    // if (amount) outgoing.append('amount', amount);
    outgoing.append('log', 'true');

    const res = await fetch(
      `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
      {
        method: 'POST',
        headers: { 'x-authorization': SLIPOK_API_KEY },
        body: outgoing
      }
    );

    const data = await res.json().catch(() => ({
      success: false,
      message: 'SlipOK ตอบกลับในรูปแบบที่ไม่รองรับ'
    }));

    return json(data, res.status);
  } catch (err) {
    return json({
      success: false,
      message: 'เกิดข้อผิดพลาดระหว่างเชื่อมต่อ SlipOK: ' + (err && err.message ? err.message : 'unknown')
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
  path: '/api/verify-slip'
};
