import fs from 'fs-extra';
import { NextResponse } from 'next/server';
import { configPath } from '../../../../chains/config';

export async function POST(request) {
    try {
        const data = await request.json();

        const filePath = configPath.configChains; // Adjust path!
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({ message: 'Chains updated successfully!' });
    } catch (error) {
        console.error('Failed to update chains:', error);
        return NextResponse.json({ error: 'Failed to update chains' }, { status: 500 });
    }
}