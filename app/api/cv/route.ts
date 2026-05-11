import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let parser: PDFParse | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No CV file uploaded." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    if (fileName.endsWith(".txt") || fileType === "text/plain") {
      const text = buffer.toString("utf-8").trim();

      return NextResponse.json({
        text,
        cvText: text,
        filename: file.name,
        pages: 1,
      });
    }

    if (!fileName.endsWith(".pdf") && fileType !== "application/pdf") {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or TXT." },
        { status: 400 }
      );
    }

    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    const text = result.text?.trim() || "";

    if (!text || text.length < 30) {
      return NextResponse.json(
        {
          error:
            "No readable CV text found. This PDF may be scanned/image-based. Please paste the CV text manually.",
          text: "",
          cvText: "",
          filename: file.name,
          pages: result.total || 0,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      cvText: text,
      filename: file.name,
      pages: result.total || 0,
    });
  } catch (error) {
    console.error("CV parsing error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown CV parsing error.";

    return NextResponse.json(
      {
        error: `Could not read this CV: ${message}. Paste the CV text manually for now.`,
      },
      { status: 500 }
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // ignore cleanup error
      }
    }
  }
}