import { EmailTemplate } from "@/components/email-template";
import { config } from "@/data/config";
import { Resend } from "resend";
import { z } from "zod";

const EmailSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing in environment variables");
  }

  return new Resend(apiKey);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Proper validation
    const result = EmailSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fullName, email, message } = result.data;

    const resend = getResend();

    // ⚠️ IMPORTANT: use verified domain email here
    const { data, error } = await resend.emails.send({
      from: "Portfolio <debanshuchatterrjee@gmail.com>", // ← CHANGE THIS
      to: [config.email],
      subject: `New message from ${fullName}`,
      replyTo: email, // ← CHANGE THIS to: email,
      react: EmailTemplate({
        fullName,
        email,
        message,
      }),
    });

    if (error) {
      console.error("Resend error:", error);

      return Response.json(
        {
          error: "Email sending failed",
          details: error,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server error:", err);

    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
};