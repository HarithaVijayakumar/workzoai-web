import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CvApiResponse = {
  ok: boolean;
  text: string;
  cvText: string;
  fileName?: string;
  fileType?: string;
  warning?: string;
  error?: string;
};

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function createManualFallback(fileName: string, reason: string) {
  return cleanText(`Uploaded CV file: ${fileName}

WorkZo received your CV, but automatic PDF text extraction could not read this file in the current local environment.

Please paste your CV text manually in the CV text box so the AI recruiter can ask accurate CV-aware questions.

Reason: ${reason}`);
}

function extractReadablePdfStrings(buffer: Buffer) {
  const raw = buffer.toString("latin1");

  const matches = raw.match(/\(([^()]{3,})\)/g) || [];
  const text = matches
    .map((item) => item.slice(1, -1))
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\-/g, "-")
    .replace(/\\,/g, ",")
    .replace(/\\\./g, ".")
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, " ");

  return cleanText(text);
}

async function extractPdfWithPdfJs(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  try {
    if ("GlobalWorkerOptions" in pdfjs && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
      ).toString();
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    } as any);

    const document = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => {
          if (typeof item?.str === "string") return item.str;
          return "";
        })
        .filter(Boolean)
        .join(" ");

      pages.push(pageText);
    }

    await document.destroy?.();

    return cleanText(pages.join("\n\n"));
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown PDF.js extraction error.";
    throw new Error(reason);
  }
}

async function extractPdfText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const pdfJsText = await extractPdfWithPdfJs(buffer);

    if (pdfJsText && pdfJsText.length >= 40) {
      return {
        text: pdfJsText,
        warning: "",
      };
    }

    throw new Error("PDF.js found too little readable text.");
  } catch (error) {
    const pdfJsReason =
      error instanceof Error ? error.message : "PDF.js extraction failed.";

    const fallbackText = extractReadablePdfStrings(buffer);

    if (fallbackText && fallbackText.length >= 80) {
      return {
        text: fallbackText,
        warning:
          "PDF text was extracted using a fallback method. Please quickly verify the CV text before starting the interview.",
      };
    }

    return {
      text: createManualFallback(file.name, pdfJsReason),
      warning:
        "PDF uploaded, but automatic extraction failed in this local environment. Paste the CV text manually for accurate interview questions.",
    };
  }
}

async function extractTextFile(file: File) {
  return cleanText(await file.text());
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json<CvApiResponse>(
        {
          ok: false,
          text: "",
          cvText: "",
          error: "No CV file uploaded.",
        },
        { status: 400 }
      );
    }

    const fileName = file.name || "uploaded-cv";
    const fileType = file.type || "unknown";
    const lowerName = fileName.toLowerCase();

    if (file.size <= 0) {
      return NextResponse.json<CvApiResponse>(
        {
          ok: false,
          text: "",
          cvText: "",
          fileName,
          fileType,
          error: "The uploaded CV file is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<CvApiResponse>(
        {
          ok: false,
          text: "",
          cvText: "",
          fileName,
          fileType,
          error: "The uploaded CV is too large. Please upload a file under 10MB.",
        },
        { status: 413 }
      );
    }

    let extractedText = "";
    let warning = "";

    if (fileType.includes("pdf") || lowerName.endsWith(".pdf")) {
      const result = await extractPdfText(file);
      extractedText = result.text;
      warning = result.warning;
    } else if (
      fileType.includes("text") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md")
    ) {
      extractedText = await extractTextFile(file);
    } else {
      warning =
        "Only PDF and TXT extraction are supported right now. Please paste DOC/DOCX CV text manually.";
      extractedText = createManualFallback(fileName, warning);
    }

    if (!extractedText || extractedText.length < 30) {
      warning =
        warning ||
        "The CV was uploaded, but very little readable text was found. It may be a scanned/image-based PDF.";
      extractedText = createManualFallback(fileName, warning);
    }

    return NextResponse.json<CvApiResponse>({
      ok: true,
      text: extractedText,
      cvText: extractedText,
      fileName,
      fileType,
      warning: warning || undefined,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown upload error.";

    return NextResponse.json<CvApiResponse>(
      {
        ok: false,
        text: "",
        cvText: "",
        error: reason,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "WorkZo CV extraction API",
    supported: ["pdf", "txt"],
  });
}
