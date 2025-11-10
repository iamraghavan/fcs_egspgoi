
"use server";

import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/lib/admissions-data.json');

type Enquiry = {
    name: string;
    phone: string;
    email?: string;
    college: string;
    course: string;
    address: string;
    enquiryDate: string;
};

async function readEnquiries(): Promise<Enquiry[]> {
    try {
        await fs.access(DATA_FILE);
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If file doesn't exist, return an empty array
        return [];
    }
}

async function writeEnquiries(enquiries: Enquiry[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(enquiries, null, 2), 'utf-8');
}

export async function saveAdmissionEnquiry(newEnquiry: Enquiry): Promise<void> {
    const enquiries = await readEnquiries();
    enquiries.push(newEnquiry);
    await writeEnquiries(enquiries);
}
