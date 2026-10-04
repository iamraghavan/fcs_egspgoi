import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/lib/admissions-data.json');

function tokenMatches(supplied: string | null, expected: string) {
  if (!supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  // Only the server knows the token (DATA_ACCESS_TOKEN). It is sent in a
  // header, not the URL, so it does not end up in logs or browser history.
  const SECRET_TOKEN = process.env.DATA_ACCESS_TOKEN;
  if (!SECRET_TOKEN || SECRET_TOKEN.length < 32) {
    return NextResponse.json({ error: 'Server configuration error: a strong access token is not set.' }, { status: 500 });
  }

  const token = request.headers.get('x-access-token');
  if (!tokenMatches(token, SECRET_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await fs.access(DATA_FILE);
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // If the file doesn't exist, return an empty array, which is valid.
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}
