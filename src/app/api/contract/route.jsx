// app/api/books/route.ts
import { getContractArtifacts } from "@/app/server/getContractData";
import { NextResponse } from "next/server";

export async function GET() {
    const contractArtifacts = await getContractArtifacts();
    return NextResponse.json(contractArtifacts);
};