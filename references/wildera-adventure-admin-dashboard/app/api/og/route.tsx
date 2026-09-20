import { ImageResponse } from "@vercel/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Fallback values
    const title = searchParams.get("title") || "Adam Hidayat — DBA Portfolio"
    const category = searchParams.get("category") || "Blog"
    const date = searchParams.get("date")

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            padding: "80px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: "40px",
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#e5e5e5",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {category}
            </span>
            {date && (
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: "#a3a3a3",
                }}
              >
                {date}
              </span>
            )}
          </div>
          
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.2,
              marginBottom: "auto",
              maxWidth: "900px",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "40px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "30px",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 30,
                fontWeight: "bold",
                marginRight: "20px",
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: 36,
                fontWeight: 500,
                color: "#d4d4d4",
              }}
            >
              adamhidayat.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
