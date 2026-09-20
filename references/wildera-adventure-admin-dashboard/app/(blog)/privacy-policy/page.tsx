import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Adam Hidayat",
  description: "Privacy Policy for Adam Hidayat's blog.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-zinc-600 dark:text-zinc-300">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6">1. Introduction</h2>
        <p>
          Welcome to Adam Hidayat's blog. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
        </p>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6">2. Information We Collect</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect on the Site includes:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
          <li><strong>Cookies:</strong> We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience.</li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6">3. Third-Party Advertising (Google AdSense)</h2>
        <p>
          We may use third-party advertising companies, such as Google AdSense, to serve ads when you visit the Site. These companies may use information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Google, as a third-party vendor, uses cookies to serve ads on this site.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet.</li>
          <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">Google Ads Settings</a>.</li>
        </ul>

        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-6">4. Contact Us</h2>
        <p>
          If you have questions or comments about this Privacy Policy, please contact us through the <Link href="/contact" className="text-blue-500 hover:underline">Contact page</Link>.
        </p>
      </div>
    </div>
  )
}
