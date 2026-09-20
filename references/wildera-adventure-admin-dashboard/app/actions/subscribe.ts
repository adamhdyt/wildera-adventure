"use server"

import { Resend } from "resend"
import { z } from "zod"


const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function subscribe(formData: FormData) {
  const result = subscribeSchema.safeParse({
    email: formData.get("email"),
  })

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" }
  }

  const { email } = result.data

  try {
    const apiKey = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_AUDIENCE_ID

    if (!apiKey || !audienceId) {
      console.warn("RESEND_API_KEY or RESEND_AUDIENCE_ID is missing. Simulating success.")
      await new Promise((resolve) => setTimeout(resolve, 600))
      return { success: true }
    }

    const resend = new Resend(apiKey)
    const { data, error } = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: audienceId,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred." }
  }
}
