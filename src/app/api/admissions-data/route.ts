import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/lib/admissions-data.json');
const SECRET_TOKEN = process.env.DATA_ACCESS_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!SECRET_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error: Access token is not set.' }, { status: 500 });
  }

  if (token !== SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await fs.access(DATA_FILE);
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    // If the file doesn't exist, return an empty array, which is valid.
    return NextResponse.json([]);
  }
}
