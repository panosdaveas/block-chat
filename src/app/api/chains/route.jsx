// app/api/books/route.ts
import { getChains } from "@/app/server/getChains";
import { NextResponse } from "next/server";

export async function GET() {
    const chains = await getChains();
    return NextResponse.json(chains);
};