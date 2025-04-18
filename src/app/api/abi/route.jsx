// app/api/books/route.ts
import { getContractAbi } from "@/app/server/getContractAbi";
import { NextResponse } from "next/server";

export async function GET() {
    const contractAbi = await getContractAbi();
    return NextResponse.json(contractAbi.abi);
};
