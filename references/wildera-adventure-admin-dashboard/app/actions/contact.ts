"use server"

import { Resend } from "resend"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please provide a valid email address"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(3000, "Message is too long"),
  botField: z.string().max(0, "Spam detected").optional(),
})

export async function sendContactMessage(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    botField: formData.get("botField") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form input" }
  }

  const { name, email, message, botField } = parsed.data

  // Silent drop if bot filled out the honeypot
  if (botField && botField.length > 0) {
    return { success: true }
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn("[Contact Action] RESEND_API_KEY is not configured. Simulating success in development.")
    console.info(`[Contact Message Received]\nName: ${name}\nEmail: ${email}\nMessage: ${message}`)
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { success: true }
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: "Adam Hidayat Portfolio <onboarding@resend.dev>",
      to: "adamhdyt11@gmail.com",
      replyTo: email,
      subject: `[Portfolio Inquiry] ${name} reached out via damz-projects`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #18181b; margin-bottom: 16px; border-bottom: 2px solid #f4f4f5; padding-bottom: 12px;">New Contact Message</h2>
          <p style="margin: 8px 0; color: #52525b; font-size: 14px;"><strong>From:</strong> ${name} (<a href="mailto:${email}" style="color: #2563eb;">${email}</a>)</p>
          <p style="margin: 8px 0; color: #52525b; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })} (Jakarta, GMT+7)</p>
          <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0284c7;">
            <p style="margin: 0; white-space: pre-wrap; color: #334155; font-size: 15px; line-height: 1.6;">${message}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[Contact Action] Resend error:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("[Contact Action] Unexpected error:", err)
    return { error: "Failed to send your message. Please try again or email adamhdyt11@gmail.com directly." }
  }
}
